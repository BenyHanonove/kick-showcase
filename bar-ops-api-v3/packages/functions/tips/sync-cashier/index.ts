import 'reflect-metadata';

import { UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

import { wrapCustomEventHandler } from '@aws/eventbridge/handler.eventbridge';
import { docClient } from '@aws/dynamo/client.dynamo';
import { redisClient } from '@aws/redis/client.redis';
import { logger } from '@utils/logger/logger.util';

interface CashierSyncDetail {
    sessionId: string;
    creditTipBar: number;
    creditTipTables: number;
}

// Synchronize cashier balance records with tip calculations in DynamoDB database
export const lambdaHandler = wrapCustomEventHandler<CashierSyncDetail>(async (detail) => {
    const { sessionId, creditTipBar, creditTipTables } = detail;

    try {
        const { Items } = await docClient.send(new QueryCommand({
            TableName: process.env.TABLE,
            IndexName: 'SessionIdIndex',
            KeyConditionExpression: 'sessionId = :sid',
            ExpressionAttributeValues: { ':sid': sessionId }
        }));

        if (!Items || Items.length === 0) return;

        const updatePromises = Items.map((item) => {
            let tipDelta = 0;
            if (item.area === 'bar') tipDelta = creditTipBar;
            else if (item.area === 'tables') tipDelta = creditTipTables;
            else return Promise.resolve();

            if (tipDelta === 0) return Promise.resolve();

            return docClient.send(new UpdateCommand({
                TableName: process.env.TABLE,
                Key: { id: item.id },
                UpdateExpression: 'ADD creditTip :delta SET lastEditor = :system',
                ExpressionAttributeValues: { ':delta': tipDelta, ':system': 'system' }
            }));
        });

        await Promise.all(updatePromises);

        // Invalidate cached reads after the updates have landed
        try {
            await redisClient.incr(`version:${process.env.TABLE}`);
        } catch {
            // Invalidation is best-effort; versioned cache keys expire via TTL
        }
    } catch (err: unknown) {
        logger.error(err);
        throw err;
    }
});
