import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import * as crypto from 'crypto';
import * as https from 'https';

import { logger } from '@utils/logger/logger.util';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

interface CognitoJwk {
  kid: string;
  alg: string;
  kty: string;
  use: string;
  n: string;
  e: string;
  [key: string]: string;
}

interface CognitoJwks {
  keys: CognitoJwk[];
}

interface CognitoTokenHeader {
  kid: string;
  alg: string;
}

interface CognitoTokenPayload {
  sub: string;
  iss: string;
  exp: number;
  aud?: string;
  client_id?: string;
  token_use?: string;
  email?: string;
}

interface WebsocketConnectEvent {
  requestContext: {
    connectionId: string;
  };
  headers?: {
    [key: string]: string | undefined;
  };
  queryStringParameters?: {
    token?: string;
    [key: string]: string | undefined;
  };
}

// Subprotocol name the dashboard offers alongside the token
const AUTH_SUBPROTOCOL = 'barops-auth';

// Rows self-expire via DynamoDB TTL, past the 2h connection max
const CONNECTION_TTL_SECONDS = 3 * 60 * 60;

// Extract JWT from the Sec-WebSocket-Protocol offer list
const tokenFromProtocolHeader = (headers?: Record<string, string | undefined>): string | undefined => {
  const raw = headers?.['Sec-WebSocket-Protocol'] ?? headers?.['sec-websocket-protocol'];
  if (!raw) return undefined;
  return raw
    .split(',')
    .map((p) => p.trim())
    .find((p) => p && p !== AUTH_SUBPROTOCOL);
};

// JWKS cache bounded by TTL; revoked keys expire
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;
let jwksCache: Record<string, string> = {};
let jwksCachedAt = 0;

// Helper to fetch JSON Web Key Set (JWKS) from Cognito
const fetchJwks = (region: string, userPoolId: string): Promise<CognitoJwks> => {
  return new Promise((resolve, reject) => {
    const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as CognitoJwks);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

// Convert JWK structure directly to PEM using Node's crypto
const jwkToPem = (jwk: CognitoJwk): string => {
  const key = crypto.createPublicKey({
    key: jwk,
    format: 'jwk'
  });
  return key.export({ type: 'pkcs1', format: 'pem' }) as string;
};

// Full cache replace on stale kid drops revoked keys
const getSigningKey = async (kid: string, region: string, userPoolId: string): Promise<string | undefined> => {
  const isStale = Date.now() - jwksCachedAt > JWKS_CACHE_TTL_MS;
  if (isStale || !jwksCache[kid]) {
    const jwks = await fetchJwks(region, userPoolId);
    const nextCache: Record<string, string> = {};
    for (const key of jwks.keys) {
      nextCache[key.kid] = jwkToPem(key);
    }
    jwksCache = nextCache;
    jwksCachedAt = Date.now();
  }
  return jwksCache[kid];
};

const verifyCognitoToken = async (token: string, region: string, userPoolId: string): Promise<CognitoTokenPayload> => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token structure');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as CognitoTokenHeader;
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as CognitoTokenPayload;

  // 1. Verify expiration; missing exp claim must be rejected
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now) {
    throw new Error('Token has expired or is missing an expiration claim');
  }

  // 2. Verify issuer matches Cognito User Pool
  const expectedIss = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  if (payload.iss !== expectedIss) {
    throw new Error('Invalid token issuer');
  }

  // 2b. Verify token issued to our app client
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (clientId) {
    const tokenClient = payload.token_use === 'access' ? payload.client_id : payload.aud;
    if (tokenClient !== clientId) {
      throw new Error('Token audience does not match the expected app client');
    }
  }
  if (payload.token_use !== 'id' && payload.token_use !== 'access') {
    throw new Error('Invalid token_use claim');
  }

  const kid = header.kid;
  if (!kid) {
    throw new Error('Missing Key ID (kid) in token header');
  }

  const pem = await getSigningKey(kid, region, userPoolId);
  if (!pem) {
    throw new Error('Matching key not found in User Pool JWKS');
  }

  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(`${headerB64}.${payloadB64}`);
  const isValid = verify.verify(pem, signatureB64, 'base64url');

  if (!isValid) {
    throw new Error('Token signature is invalid');
  }

  return payload;
};

// Establish new WebSocket client connection and store connection identifier in database
export const handler = async (event: WebsocketConnectEvent): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;

  // Query-string token is a deprecated fallback for old clients
  const headerToken = tokenFromProtocolHeader(event.headers);
  const token = headerToken || event.queryStringParameters?.token;

  if (!token) {
    logger.warn('Connection rejected: missing connection token');
    return { statusCode: 401, body: 'Missing connection token.' };
  }
  if (!headerToken) {
    logger.warn('Connection used deprecated query-string token transport');
  }

  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("CRITICAL CONFIGURATION ERROR: AWS_REGION environment variable is missing!");
  }
  const userPoolId = process.env.COGNITO_USER_POOL_ID;

  if (!userPoolId) {
    logger.error('COGNITO_USER_POOL_ID environment variable is not configured');
    return { statusCode: 500, body: 'Internal server configuration error.' };
  }

  try {
    const payload = await verifyCognitoToken(token, region, userPoolId);

    // Save connection ID and Cognito sub to DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.TABLE!,
      Item: {
        connectionId: connectionId,
        userId: payload.sub,
        connectedAt: new Date().toISOString(),
        // DynamoDB TTL: reaps rows missed by $disconnect
        expireAt: Math.floor(Date.now() / 1000) + CONNECTION_TTL_SECONDS
      }
    }));

    // Echo selected subprotocol for browsers that offered one
    return {
      statusCode: 200,
      headers: headerToken ? { 'Sec-WebSocket-Protocol': AUTH_SUBPROTOCOL } : undefined,
      body: 'Connected.'
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('WebSocket connection authentication failed:', errorMessage);
    return { statusCode: 401, body: 'Unauthorized connection.' };
  }
};
