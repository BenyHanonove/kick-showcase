import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { StatusCodes } from 'http-status-codes';

import { docClient } from '@aws/dynamo/client.dynamo';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { extractId } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

const MESSAGES = new ResourceMessages('עובד', 'עובדים');

// Revoke all active shift registration tokens for specified session event record
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = extractId(event, 'id', MESSAGES.ERROR.MISSING_ID);
        if (typeof id !== 'string') return id;

        // Find any outstanding token(s) for this employee and delete them
        const existing = await docClient.send(new QueryCommand({
            TableName: process.env.TOKEN_TABLE!,
            IndexName: 'EmployeeIdIndex',
            KeyConditionExpression: 'employeeId = :employeeId',
            ExpressionAttributeValues: { ':employeeId': id },
        }));

        for (const item of existing.Items || []) {
            await docClient.send(new DeleteCommand({
                TableName: process.env.TOKEN_TABLE!,
                Key: { token: item.token },
            }));
        }

        // Idempotent: succeeds whether or not a token existed
        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({ message: MESSAGES.SUCCESS.DELETED }),
        };
    } catch (err: unknown) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
});
