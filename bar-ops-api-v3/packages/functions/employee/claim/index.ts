import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { StatusCodes } from 'http-status-codes';

// Import shared AWS services, guard security middleware, and utility helpers
import { docClient } from '@aws/dynamo/client.dynamo';
import { update, ConcurrencyConflictError } from '@aws/dynamo/update.dynamo';
import { validateBody } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
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

        // Atomically consume the token: only succeeds if still unused and unexpired.
        // Prevents a TOCTOU race between checking and marking the token used.
        const nowEpoch = Math.floor(Date.now() / 1000);
        let employeeId: string;
        try {
            const consumeRes = await docClient.send(new UpdateCommand({
                TableName: process.env.TOKEN_TABLE!,
                Key: { token },
                UpdateExpression: 'SET used = :true',
                ConditionExpression: 'used = :false AND expiresAt > :now',
                ExpressionAttributeValues: {
                    ':true': true,
                    ':false': false,
                    ':now': nowEpoch,
                },
                ReturnValues: 'ALL_NEW',
            }));
            employeeId = consumeRes.Attributes?.employeeId as string;
        } catch (err) {
            if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
                return invalidLinkResponse();
            }
            throw err;
        }

        // Apply the update to the employee record configuration setting for
        let employeeInstance: EmployeeDto | null;
        try {
            employeeInstance = await update(process.env.TABLE!, employeeId, updateFields, EmployeeDto);
        } catch (errors) {
            if (errors instanceof ConcurrencyConflictError) {
                return {
                    statusCode: StatusCodes.CONFLICT,
                    body: JSON.stringify({ message: MESSAGES.ERROR.CONCURRENCY_CONFLICT }),
                };
            }
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        if (!employeeInstance) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
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
