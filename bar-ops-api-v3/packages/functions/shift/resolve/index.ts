import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { StatusCodes } from 'http-status-codes';
import { plainToInstance } from 'class-transformer';

// Import shared AWS services, guard security middleware, and utility helpers
import { docClient } from '@aws/dynamo/client.dynamo';
import { list } from '@aws/dynamo/list.dynamo';
import { validateBody } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { ShiftDto } from '@dtos/shift/shift.dto';
import { ShiftTokenDto } from '@dtos/shift/token.dto';
import { ResolveShiftRegistrationDto } from '@dtos/shift/resolve.dto';

const MESSAGES = new ResourceMessages('משמרת', 'משמרות');

// Generic message for any invalid/expired/spent token - never reveals which
const INVALID_LINK_MESSAGE = 'הקישור אינו תקין או שפג תוקפו';

const invalidLinkResponse = (): APIGatewayProxyResultV2 => ({
    statusCode: StatusCodes.BAD_REQUEST,
    body: JSON.stringify({ message: INVALID_LINK_MESSAGE }),
});

// Resolve unauthenticated shift registration token details directly from DynamoDB database table
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, ShiftTokenDto, INVALID_LINK_MESSAGE);
        if (error) return invalidLinkResponse();

        const tokenRes = await docClient.send(new GetCommand({
            TableName: process.env.TOKEN_TABLE!,
            Key: { token: body.token },
        }));

        const tokenItem = tokenRes.Item;
        const nowEpoch = Math.floor(Date.now() / 1000);
        const isTokenValid = tokenItem
            && tokenItem.used === false
            && typeof tokenItem.expiresAt === 'number'
            && tokenItem.expiresAt > nowEpoch;

        if (!isTokenValid) return invalidLinkResponse();

        const { sessionId, employeeId } = tokenItem;

        // The token holder's own shift, if an admin already staffed
        // left - everything else the page shows is snapshotted on the token
        const ownShifts = await list(process.env.TABLE!, ShiftDto, {
            indexName: 'SessionIdIndex',
            keyConditionExpression: 'sessionId = :sessionId',
            filterExpression: 'employeeId = :employeeId',
            expressionAttributeValues: { ':sessionId': sessionId, ':employeeId': employeeId },
        });

        const ownShift = ownShifts[0];

        // Display fields come off the token, so the page shows
        const data = plainToInstance(ResolveShiftRegistrationDto, {
            employee: { firstName: tokenItem.firstName },
            session: {
                name: tokenItem.name,
                brand: tokenItem.brand,
                datetime: tokenItem.datetime,
                location: tokenItem.location,
            },
            registered: Boolean(ownShift),
            registeredRole: ownShift?.role,
        });

        logger.info('[resolve] token resolved', {
            firstName: tokenItem.firstName,
            registered: Boolean(ownShift),
        });

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({ message: MESSAGES.SUCCESS.LOADED, data }),
        };
    } catch (err: unknown) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
};
