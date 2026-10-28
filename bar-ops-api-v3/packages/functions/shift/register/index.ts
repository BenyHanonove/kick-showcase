import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { StatusCodes } from 'http-status-codes';
import { plainToInstance } from 'class-transformer';

// Import shared AWS services, guard security middleware, and utility helpers
import { docClient } from '@aws/dynamo/client.dynamo';
import { create } from '@aws/dynamo/create.dynamo';
import { list } from '@aws/dynamo/list.dynamo';
import { validateBody } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { ShiftDto } from '@dtos/shift/shift.dto';
import { RegisterShiftDto } from '@dtos/shift/register.dto';
import { RegisterShiftResultDto } from '@dtos/shift/register-result.dto';
import { ShiftRegistration } from '@dtos/shift/shift.enum';

const MESSAGES = new ResourceMessages('משמרת', 'משמרות');

// Generic message for any invalid/expired/spent token - never reveals which
const INVALID_LINK_MESSAGE = 'הקישור אינו תקין או שפג תוקפו';

// The one refusal that names its reason, because the employee
const ALREADY_REGISTERED_MESSAGE = 'כבר שובצת לאירוע זה';

const invalidLinkResponse = (): APIGatewayProxyResultV2 => ({
    statusCode: StatusCodes.BAD_REQUEST,
    body: JSON.stringify({ message: INVALID_LINK_MESSAGE }),
});

// Register employee worker for scheduled shift event using active registration token
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        // Validate request body shape (token + role, notes optional)
        const { data: body, error } = await validateBody(event, RegisterShiftDto, INVALID_LINK_MESSAGE);
        if (error) return invalidLinkResponse();

        const { token, role, notes } = body;

        // Read the token first: a refused registration must not burn it
        const tokenRes = await docClient.send(new GetCommand({
            TableName: process.env.TOKEN_TABLE!,
            Key: { token },
        }));

        const tokenItem = tokenRes.Item;
        const nowEpoch = Math.floor(Date.now() / 1000);
        const isTokenValid = tokenItem
            && tokenItem.used === false
            && typeof tokenItem.expiresAt === 'number'
            && tokenItem.expiresAt > nowEpoch;

        if (!isTokenValid) return invalidLinkResponse();

        const { sessionId, employeeId } = tokenItem;

        // One shift per employee per event; the token survives so
        const existing = await list(process.env.TABLE!, ShiftDto, {
            indexName: 'SessionIdIndex',
            keyConditionExpression: 'sessionId = :sessionId',
            filterExpression: 'employeeId = :employeeId',
            expressionAttributeValues: { ':sessionId': sessionId, ':employeeId': employeeId },
        });

        if (existing.length > 0) {
            logger.warn('[register] employee already staffed on this event', { sessionId, employeeId });
            return {
                statusCode: StatusCodes.CONFLICT,
                body: JSON.stringify({ message: ALREADY_REGISTERED_MESSAGE }),
            };
        }

        // Atomically consume the token by deleting the row - a
        // The condition makes this the single-use guarantee: of two concurrent submits only
        // one delete can find the row, so only one shift
        try {
            await docClient.send(new DeleteCommand({
                TableName: process.env.TOKEN_TABLE!,
                Key: { token },
                ConditionExpression: 'attribute_exists(#token) AND expiresAt > :now',
                ExpressionAttributeNames: { '#token': 'token' },
                ExpressionAttributeValues: { ':now': nowEpoch },
            }));
        } catch (err) {
            if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
                return invalidLinkResponse();
            }
            throw err;
        }

        // Session and employee come off the token row, never off the request
        let shiftInstance: ShiftDto;
        try {
            shiftInstance = await create(process.env.TABLE!, {
                sessionId,
                employeeId,
                role,
                notes,
                // No timing: the manager sets it when staffing the event
                // Self-registration is a declaration of availability, a manager still approves it
                registration: ShiftRegistration.PENDING,
                // Hours not verified yet
                approved: false,
            }, ShiftDto);
        } catch (errors) {
            logger.error(errors);
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED }),
            };
        }

        logger.info('[register] shift created', { role });

        // Only the fields the confirmation screen renders leave the server
        const data = plainToInstance(RegisterShiftResultDto, {
            id: shiftInstance.id,
            role: shiftInstance.role,
        });

        return {
            statusCode: StatusCodes.CREATED,
            body: JSON.stringify({ message: MESSAGES.SUCCESS.CREATED, data }),
        };
    } catch (err: unknown) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
};
