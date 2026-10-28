import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import {

    CognitoIdentityProviderClient,
    AdminInitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { validateBody } from '@utils/request/request.util';

import { LoginDto } from '@dtos/auth/login.dto';

import { buildUserFromIdToken } from '@utils/auth/token.util';
import { buildRefreshCookie, clearLegacyCookies } from '@utils/auth/cookie.util';

import { ResourceMessages } from '@utils/messages/resource.util';

import { logger } from '@utils/logger/logger.util';

const MESSAGES = new ResourceMessages('התחברות', 'התחברויות');
const INVALID_CREDENTIALS_MESSAGE = 'שם משתמש או סיסמה שגויים';

const client = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'eu-west-1_EcYLFbA3Q';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '439ldfj689k03nmphv65aaepev';

// Process auth login operation request and return JSON HTTP response
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, LoginDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        const authResult = await (async () => {
            try {
                const result = await client.send(new AdminInitiateAuthCommand({
                    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
                    UserPoolId: USER_POOL_ID,
                    ClientId: CLIENT_ID,
                    AuthParameters: { USERNAME: body.email, PASSWORD: body.password },
                }));
                return result.AuthenticationResult;
            } catch (err) {
                // Logs both bad credentials and real misconfiguration configuration setting for
                logger.error(err);
                return undefined;
            }
        })();

        if (!authResult?.AccessToken || !authResult.IdToken || !authResult.RefreshToken) {
            return {
                statusCode: StatusCodes.UNAUTHORIZED,
                body: JSON.stringify({ message: INVALID_CREDENTIALS_MESSAGE }),
            };
        }

        const user = buildUserFromIdToken(authResult.IdToken);

        return {
            statusCode: StatusCodes.OK,
            cookies: [buildRefreshCookie(authResult.RefreshToken), ...clearLegacyCookies()],
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.LOADED,
                data: {
                    user,
                    authTokens: {
                        AccessToken: authResult.AccessToken,
                        IdToken: authResult.IdToken,
                        ExpiresIn: authResult.ExpiresIn,
                        ExpiresAt: Date.now() + (authResult.ExpiresIn ?? 3600) * 1000,
                    },
                },
            }),
        };
    } catch (err) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
};
