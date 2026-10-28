import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { StatusCodes } from 'http-status-codes';

import { docClient } from '@aws/dynamo/client.dynamo';
import { buildUpdateInput, hydrate, resolveConditionFailure, ConcurrencyConflictError } from '@aws/dynamo/update.dynamo';
import { invalidateTable } from '@aws/dynamo/create.dynamo';
import { isTransactionCanceled, cancellationCodes } from '@aws/dynamo/transaction.dynamo';
import { type DynamoItem } from '@aws/dynamo/item.dynamo';
import { validateBody } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { ClaimEmployeeDto } from '@dtos/employee/claim.dto';
import { EmployeeDto } from '@dtos/employee/employee.dto';

const MESSAGES = new ResourceMessages('עובד', 'עובדים');

// Generic message for any invalid/expired/used token - avoids leaking which
const INVALID_LINK_MESSAGE = 'הקישור אינו תקין או שפג תוקפו';

const invalidLinkResponse = (): APIGatewayProxyResultV2 => ({
    statusCode: StatusCodes.BAD_REQUEST,
    body: JSON.stringify({ message: INVALID_LINK_MESSAGE }),
});

// Process employee claim operation request and return JSON HTTP response
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, ClaimEmployeeDto, INVALID_LINK_MESSAGE);
        if (error) return invalidLinkResponse();

        const { token, ...updateFields } = body;

        // Read the token to learn whose link it is. Nothing is written yet, so a refused
        // claim (bad body, stale timestamp) leaves the link usable.
        const nowEpoch = Math.floor(Date.now() / 1000);
        const { Item: tokenItem } = await docClient.send(new GetCommand({
            TableName: process.env.TOKEN_TABLE!,
            Key: { token },
            ConsistentRead: true,
        }));

        if (!tokenItem
            || tokenItem.used !== false
            || typeof tokenItem.expiresAt !== 'number'
            || tokenItem.expiresAt <= nowEpoch
            || typeof tokenItem.employeeId !== 'string') {
            return invalidLinkResponse();
        }

        const employeeId = tokenItem.employeeId;
        const tableName = process.env.TABLE!;

        let employeeUpdate: ReturnType<typeof buildUpdateInput>;
        try {
            employeeUpdate = buildUpdateInput(tableName, employeeId, updateFields);
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        // Mark the link used and apply the employee's details in one transaction, so the
        // link is only spent if the update lands. The token condition is the single-use
        // guarantee (no TOCTOU between the read above and this write); the employee
        // condition is the usual exists + optimistic-lock check from update().
        try {
            await docClient.send(new TransactWriteCommand({
                TransactItems: [
                    {
                        Update: {
                            TableName: process.env.TOKEN_TABLE!,
                            Key: { token },
                            UpdateExpression: 'SET used = :true',
                            ConditionExpression: 'used = :false AND expiresAt > :now AND employeeId = :employeeId',
                            ExpressionAttributeValues: {
                                ':true': true,
                                ':false': false,
                                ':now': nowEpoch,
                                ':employeeId': employeeId,
                            },
                        },
                    },
                    { Update: employeeUpdate },
                ],
            }));
        } catch (err) {
            if (!isTransactionCanceled(err)) throw err;

            const [tokenCode, employeeCode] = cancellationCodes(err);
            if (tokenCode === 'ConditionalCheckFailed') return invalidLinkResponse();

            if (employeeCode === 'ConditionalCheckFailed') {
                try {
                    await resolveConditionFailure(tableName, employeeId);
                    return {
                        statusCode: StatusCodes.NOT_FOUND,
                        body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
                    };
                } catch (conflict) {
                    if (!(conflict instanceof ConcurrencyConflictError)) throw conflict;
                    return {
                        statusCode: StatusCodes.CONFLICT,
                        body: JSON.stringify({ message: MESSAGES.ERROR.CONCURRENCY_CONFLICT }),
                    };
                }
            }

            // TransactionConflict: the same link is being claimed concurrently
            logger.warn('[claim] transaction cancelled', { reasons: cancellationCodes(err) });
            return {
                statusCode: StatusCodes.CONFLICT,
                body: JSON.stringify({ message: MESSAGES.ERROR.CONCURRENCY_CONFLICT }),
            };
        }

        await invalidateTable(tableName);

        // Strongly consistent read so the response reflects the write we just made
        const { Item: saved } = await docClient.send(new GetCommand({
            TableName: tableName,
            Key: { id: employeeId },
            ConsistentRead: true,
        }));

        if (!saved) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
            };
        }

        let employeeInstance: EmployeeDto;
        try {
            employeeInstance = await hydrate(saved as DynamoItem, EmployeeDto);
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.UPDATED,
                data: employeeInstance,
            }),
        };
    } catch (err: unknown) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
};
