import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Import shared AWS services, guard security middleware, and utility helpers
import { wrapCustomEventHandler } from '@aws/eventbridge/handler.eventbridge';
import { docClient } from '@aws/dynamo/client.dynamo';
import { redisClient } from '@aws/redis/client.redis';
import { logger } from '@utils/logger/logger.util';

interface IntervalSyncDetail {
    shiftId: string;
    totalHours: number;
}

// Synchronize interval time tracking records with shift schedule in DynamoDB database
export const lambdaHandler = wrapCustomEventHandler<IntervalSyncDetail>(async (detail) => {
    const { shiftId, totalHours } = detail;
    if (!shiftId || !totalHours) return;

    try {
        await docClient.send(new UpdateCommand({
            TableName: process.env.TABLE,
            Key: { id: shiftId },
            UpdateExpression: 'ADD totalHours :val SET lastEditor = :system',
            ExpressionAttributeValues: { ':val': totalHours, ':system': 'system' },
            ConditionExpression: 'attribute_exists(id)'
        }));

        // Invalidate cached reads after the update has landed
        try {
            await redisClient.incr(`version:${process.env.TABLE}`);
        } catch {
            // Invalidation is best-effort; versioned cache keys expire via TTL
        }
    } catch (err: unknown) {
        logger.error('Error updating shift:', err);
        throw err;
    }
});