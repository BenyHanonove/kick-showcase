import 'reflect-metadata';

import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { wrapCustomEventHandler } from '@aws/eventbridge/handler.eventbridge';
import { docClient } from '@aws/dynamo/client.dynamo';
import { redisClient } from '@aws/redis/client.redis';
import { logger } from '@utils/logger/logger.util';

interface VehicleSyncDetail {
    driverShiftId: string | null;
    oldDriverShiftId: string | null;
    bonusTravel: number;
}

// Synchronize vehicle travel bonus calculations with shift schedule in DynamoDB database
export const lambdaHandler = wrapCustomEventHandler<VehicleSyncDetail>(async (detail) => {
    const { driverShiftId, oldDriverShiftId, bonusTravel } = detail;

    const updatePromises: Promise<unknown>[] = [];

    // Clear old driver's bonus if replaced or vehicle removed
    if (oldDriverShiftId) {
        updatePromises.push(
            docClient.send(new UpdateCommand({
                TableName: process.env.TABLE,
                Key: { id: oldDriverShiftId },
                UpdateExpression: 'SET bonusTravel = :zero, lastEditor = :system',
                ExpressionAttributeValues: { ':zero': 0, ':system': 'system' },
                ConditionExpression: 'attribute_exists(id)'
            })).catch(err => {
                // If shift does not exist or condition fails, ignore
                logger.warn(`Could not clear travel bonus for old driver shift ${oldDriverShiftId}:`, err);
            })
        );
    }

    // Set travel bonus on the current driver shift
    if (driverShiftId) {
        updatePromises.push(
            docClient.send(new UpdateCommand({
                TableName: process.env.TABLE,
                Key: { id: driverShiftId },
                UpdateExpression: 'SET bonusTravel = :val, lastEditor = :system',
                ExpressionAttributeValues: { ':val': bonusTravel, ':system': 'system' },
                ConditionExpression: 'attribute_exists(id)'
            })).catch(err => {
                logger.warn(`Could not set travel bonus for driver shift ${driverShiftId}:`, err);
            })
        );
    }

    if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        // Invalidate cached reads after the updates have landed
        try {
            await redisClient.incr(`version:${process.env.TABLE}`);
        } catch {
            // Invalidation is best-effort; versioned cache keys expire via TTL
        }
    }
});
