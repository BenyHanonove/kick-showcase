import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

// Import shared AWS services, guard security middleware, and utility helpers
import { buildUserFromIdToken } from '@utils/auth/token.util';
import {
    buildRefreshCookie,
    clearLegacyCookies,
    clearRefreshCookies,
    extractRefreshCookies,
    isAllowedOrigin,
} from '@utils/auth/cookie.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

const MESSAGES = new ResourceMessages('התחברות', 'התחברויות');
const SESSION_EXPIRED_MESSAGE = 'תוקף החיבור פג, יש להתחבר מחדש';

const client = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '439ldfj689k03nmphv65aaepev';

// Process auth refresh operation request and return JSON HTTP response
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        if (!isAllowedOrigin(event)) {
            return {
                statusCode: StatusCodes.FORBIDDEN,
                body: JSON.stringify({ message: 'Invalid origin request' }),
            };
        }

        const candidateTokens = extractRefreshCookies(event);
        if (candidateTokens.length === 0) {
            return {
                statusCode: StatusCodes.UNAUTHORIZED,
                body: JSON.stringify({ message: SESSION_EXPIRED_MESSAGE }),
            };
        }

        let workingAuthResult: {
            authResult: NonNullable<Awaited<ReturnType<typeof client.send>>['AuthenticationResult']>;
            activeRefreshToken: string;
        } | undefined;

        for (const token of candidateTokens) {
            try {
                const result = await client.send(new InitiateAuthCommand({
                    AuthFlow: 'REFRESH_TOKEN_AUTH',
                    ClientId: CLIENT_ID,
                    AuthParameters: { REFRESH_TOKEN: token },
                }));
                if (result.AuthenticationResult?.AccessToken && result.AuthenticationResult?.IdToken) {
                    workingAuthResult = {
                        authResult: result.AuthenticationResult,
                        activeRefreshToken: result.AuthenticationResult.RefreshToken ?? token,
                    };
                    break;
                }
            } catch (err) {
                logger.error(err);
            }
        }

        // Expired or revoked refresh token — clear all dead cookie variants
        if (!workingAuthResult) {
            return {
                statusCode: StatusCodes.UNAUTHORIZED,
                cookies: clearRefreshCookies(),
                body: JSON.stringify({ message: SESSION_EXPIRED_MESSAGE }),
            };
        }

        const { authResult, activeRefreshToken } = workingAuthResult;
        const user = buildUserFromIdToken(authResult.IdToken!);

        return {
            statusCode: StatusCodes.OK,
            // Re-set active cookie and purge all legacy / partitioned ghost cookies
            cookies: [buildRefreshCookie(activeRefreshToken), ...clearLegacyCookies()],
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
