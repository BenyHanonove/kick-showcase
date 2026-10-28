import 'reflect-metadata';

import { type EventBridgeEvent, type DynamoDBRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';
import { logger } from '@utils/logger/logger.util';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
    unmarshallOptions: { wrapNumbers: false },
});

// Process session stream mutations from DynamoDB to synchronize related entity states
export const lambdaHandler = async (event: EventBridgeEvent<string, DynamoDBRecord>): Promise<void> => {
    try {
        // The Client stream record forwarded by the EventBridge Pipe
        const record = event.detail;

        // Extract client ID from the stream record keys
        const clientId = record.dynamodb?.Keys?.id?.S;
        if (!clientId) return;

        // Cascade delete sessions when a client is removed
        if (record.eventName === 'REMOVE') {
            await cascadeDeleteByField(
                process.env.TABLE!,
                'ClientIdIndex',
                'clientId',
                clientId
            );
        }
    } catch (err: unknown) {
        logger.error(err);
        throw err;
    }
};
