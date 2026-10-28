// Import external framework dependencies and status codes from third party packages
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { StatusCodes } from 'http-status-codes';
import { type APIGatewayProxyResultV2 } from 'aws-lambda';

// Import shared AWS services, guard security middleware, and utility helpers
import { docClient } from '@aws/dynamo/client.dynamo';
import { ResourceMessages } from '@utils/messages/resource.util';

export const validateCashierSerial = async (
    sessionId: string,
    serial: string,
    messages: ResourceMessages
): Promise<{ error: null } | { error: APIGatewayProxyResultV2 }> => {
    const check = await docClient.send(
        new QueryCommand({
            TableName: process.env.TABLE,
            IndexName: 'SessionIdIndex',
            KeyConditionExpression: 'sessionId = :sessionId',
            FilterExpression: 'serial = :serial',
            ExpressionAttributeValues: {
                ':sessionId': sessionId,
                ':serial': serial,
            },
        })
    );

    if (check.Items && check.Items.length > 0) {
        return {
            error: {
                statusCode: StatusCodes.CONFLICT,
                body: JSON.stringify({ message: messages.ERROR.ALREADY_EXISTS }),
            }
        };
    }

    return { error: null };
};
