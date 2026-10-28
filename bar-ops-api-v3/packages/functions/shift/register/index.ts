import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { StatusCodes } from 'http-status-codes';
import { plainToInstance } from 'class-transformer';

import { docClient } from '@aws/dynamo/client.dynamo';
import { prepareCreate, invalidateTable, type PreparedCreate } from '@aws/dynamo/create.dynamo';
import { isTransactionCanceled, cancellationCodes } from '@aws/dynamo/transaction.dynamo';
import { list } from '@aws/dynamo/list.dynamo';
import { validateBody } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';
import { deterministicId } from '@utils/id/deterministic-id.util';

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

const alreadyRegisteredResponse = (): APIGatewayProxyResultV2 => ({
    statusCode: StatusCodes.CONFLICT,
    body: JSON.stringify({ message: ALREADY_REGISTERED_MESSAGE }),
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
            ConsistentRead: true,
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
            return alreadyRegisteredResponse();
        }

        // Session and employee come off the token row, never off the request.
        // The id is derived from (session, employee): two registrations racing on two
        // different links for the same person collide on the same row instead of both passing
        // the check above.
        let prepared: PreparedCreate<ShiftDto>;
        try {
            prepared = await prepareCreate({
                id: deterministicId('shift-registration', sessionId, employeeId),
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

        // Consume the link and create the shift in one transaction: either both happen or
        // neither does, so a failed create can never burn the link and a link can never
        // produce two shifts. The token condition is the single-use guarantee: of two
        // concurrent submits only one transaction can still find the row.
        try {
            await docClient.send(new TransactWriteCommand({
                TransactItems: [
                    {
                        Delete: {
                            TableName: process.env.TOKEN_TABLE!,
                            Key: { token },
                            ConditionExpression: 'attribute_exists(#token) AND #used = :false AND expiresAt > :now',
                            ExpressionAttributeNames: { '#token': 'token', '#used': 'used' },
                            ExpressionAttributeValues: { ':false': false, ':now': nowEpoch },
                        },
                    },
                    {
                        Put: {
                            TableName: process.env.TABLE!,
                            Item: prepared.item,
                            ConditionExpression: 'attribute_not_exists(id)',
                        },
                    },
                ],
            }));
        } catch (err) {
            if (!isTransactionCanceled(err)) throw err;

            const [tokenCode, shiftCode] = cancellationCodes(err);
            if (tokenCode === 'ConditionalCheckFailed') {
                // Spent or expired between our read and the write
                return invalidLinkResponse();
            }
            if (shiftCode === 'ConditionalCheckFailed') {
                logger.warn('[register] concurrent registration for the same employee and event', { sessionId, employeeId });
                return alreadyRegisteredResponse();
            }
            // TransactionConflict: another request is consuming this very link right now
            logger.warn('[register] transaction cancelled', { reasons: cancellationCodes(err) });
            return {
                statusCode: StatusCodes.CONFLICT,
                body: JSON.stringify({ message: MESSAGES.ERROR.CONCURRENCY_CONFLICT }),
            };
        }

        await invalidateTable(process.env.TABLE!);
        const shiftInstance = prepared.instance;

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
