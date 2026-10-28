import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { type APIGatewayProxyEventV2 } from 'aws-lambda';

interface EventOptions {
    groups?: string | string[];
    sub?: string;
    body?: unknown;
    pathParameters?: Record<string, string>;
}

// Builds the slice of an HTTP API v2 event that our handlers and RolesGuard read
export const apiEvent = ({ groups, sub, body, pathParameters }: EventOptions = {}): APIGatewayProxyEventV2 => {
    const claims: Record<string, unknown> = {};
    if (groups !== undefined) claims['cognito:groups'] = groups;
    if (sub !== undefined) claims.sub = sub;

    return {
        version: '2.0',
        routeKey: 'ANY /test',
        rawPath: '/test',
        rawQueryString: '',
        headers: {},
        isBase64Encoded: false,
        body: body === undefined ? undefined : JSON.stringify(body),
        pathParameters,
        requestContext: {
            authorizer: Object.keys(claims).length ? { jwt: { claims, scopes: [] } } : undefined,
        },
    } as unknown as APIGatewayProxyEventV2;
};

export const parseBody = (result: unknown): { message?: string; data?: unknown; errors?: unknown } => {
    const body = (result as { body?: string }).body;
    return body ? JSON.parse(body) : {};
};

export const statusOf = (result: unknown): number | undefined => (result as { statusCode?: number }).statusCode;

export const conditionalCheckFailed = (): Error =>
    new ConditionalCheckFailedException({ message: 'The conditional request failed', $metadata: {} });
