import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { CognitoIdentityProviderClient, GlobalSignOutCommand, RevokeTokenCommand } from '@aws-sdk/client-cognito-identity-provider';

import { clearRefreshCookies, extractRefreshCookies, isAllowedOrigin } from '@utils/auth/cookie.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

const MESSAGES = new ResourceMessages('התנתקות', 'התנתקויות');

const client = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '439ldfj689k03nmphv65aaepev';

// Cognito verifies the access token itself, no admin IAM needed
const extractAccessToken = (event: APIGatewayProxyEventV2): string | undefined => {
    const header = event.headers?.authorization ?? event.headers?.Authorization;
    return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
};

// Process auth logout operation request and return JSON HTTP response
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        if (!isAllowedOrigin(event)) {
            return {
                statusCode: StatusCodes.FORBIDDEN,
                body: JSON.stringify({ message: 'Invalid origin request' }),
            };
        }

        const refreshTokens = extractRefreshCookies(event);
        const accessToken = extractAccessToken(event);

        if (refreshTokens.length > 0 && CLIENT_ID) {
            for (const token of refreshTokens) {
                try {
                    await client.send(new RevokeTokenCommand({
                        ClientId: CLIENT_ID,
                        Token: token,
                    }));
                } catch (err) {
                    logger.error(err);
                }
            }
        } else if (accessToken) {
            try {
                await client.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
            } catch (err) {
                logger.error(err);
            }
        }

        return {
            statusCode: StatusCodes.OK,
            cookies: clearRefreshCookies(),
            body: JSON.stringify({ message: MESSAGES.SUCCESS.DELETED }),
        };
    } catch (err) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
};
