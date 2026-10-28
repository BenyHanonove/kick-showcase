import 'reflect-metadata';

import { type EventBridgeEvent, type DynamoDBRecord } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

import { docClient } from '@aws/dynamo/client.dynamo';
import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';
import { invalidateTable } from '@aws/dynamo/create.dynamo';
import { deterministicId } from '@utils/id/deterministic-id.util';
import { logger } from '@utils/logger/logger.util';

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

        // On INSERT, seed one tips row per service area. EventBridge delivers at least
        // once, so the row id is derived from (session, area) and the put only succeeds
        // if that row does not exist yet: a redelivery is a no-op, not a duplicate row.
        if (record.eventName === 'INSERT') {
            const tableName = process.env.TABLE!;
            const timestamp = new Date().toISOString();
            let created = 0;

            for (const area of ['bar', 'tables'] as const) {
                const item: SessionTipRecord = {
                    id: deterministicId('session-tips', sessionId, area),
                    sessionId,
                    area,
                    cashTip: 0,
                    creditTip: 0,
                    runnerFeed: 50,
                    totalHours: 0,
                    timestamp,
                };
                try {
                    await docClient.send(new PutCommand({
                        TableName: tableName,
                        Item: item,
                        ConditionExpression: 'attribute_not_exists(id)',
                    }));
                    created++;
                } catch (err) {
                    if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
                        // Already seeded by an earlier delivery of this event
                        continue;
                    }
                    throw err;
                }
            }

            if (created > 0) await invalidateTable(tableName);
            else logger.info('[tips observer] duplicate INSERT delivery ignored', { sessionId });
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
