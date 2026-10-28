import 'reflect-metadata';

import { type EventBridgeEvent, type DynamoDBRecord } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';
import { redisClient } from '@aws/redis/client.redis';
import { logger } from '@utils/logger/logger.util';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
    unmarshallOptions: { wrapNumbers: false },
});

// Shape of a tips record seeded for a session
interface SessionTipRecord {
    id: string;
    sessionId: string;
    area: 'bar' | 'tables';
    cashTip: number;
    creditTip: number;
    runnerFeed: number;
    totalHours: number;
    timestamp: string;
}

// Process tips stream mutations from DynamoDB to synchronize related entity states
export const lambdaHandler = async (event: EventBridgeEvent<string, DynamoDBRecord>): Promise<void> => {
    try {
        // The Session stream record forwarded by the EventBridge Pipe
        const record = event.detail;

        // Guard: verify record is from the Session table only
        if (record.eventSourceARN && !record.eventSourceARN.includes('BarOps-Session')) {
            return;
        }

        // Extract session ID from the stream record keys
        const sessionId = record.dynamodb?.Keys?.id?.S;
        if (!sessionId) return;

        // On INSERT, seed default tips rows per service area
        if (record.eventName === 'INSERT') {
            const writeRequests = (['bar', 'tables'] as const).map((area) => ({
                PutRequest: {
                    Item: {
                        id: uuidv4(),
                        sessionId,
                        area,
                        cashTip: 0,
                        creditTip: 0,
                        runnerFeed: 50,
                        totalHours: 0,
                        timestamp: new Date().toISOString(),
                    } as SessionTipRecord,
                },
            }));

            await docClient.send(new BatchWriteCommand({
                RequestItems: {
                    [process.env.TABLE!]: writeRequests
                }
            }));

            // Invalidate Redis list cache for Tips table
            try {
                await redisClient.incr(`version:${process.env.TABLE!}`);
            } catch (err) {
                logger.error("Redis version increment error in tips observer INSERT:", err);
            }
        }

        // On REMOVE, cascade delete all tips for that session
        if (record.eventName === 'REMOVE') {
            await cascadeDeleteByField(
                process.env.TABLE!,
                'SessionIdIndex',
                'sessionId',
                sessionId
            );
        }
    } catch (err: unknown) {
        logger.error(err);
        throw err;
    }
};
