import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { list } from '@aws/dynamo/list.dynamo';
import { redisClient } from '@aws/redis/client.redis';
import { WidgetDto } from '../helpers/fixtures';

const ddb = mockClient(DynamoDBDocumentClient);

const widgets = (from: number, count: number) =>
    Array.from({ length: count }, (_, i) => ({ id: `w${from + i}`, name: `Widget ${from + i}` }));

describe('list() pagination', () => {
    beforeEach(async () => {
        ddb.reset();
        await redisClient.flushall();
    });

    it('follows LastEvaluatedKey across 3 Scan pages and returns every item', async () => {
        ddb.on(ScanCommand)
            .resolvesOnce({ Items: widgets(0, 2), LastEvaluatedKey: { id: 'w1' } })
            .resolvesOnce({ Items: widgets(2, 2), LastEvaluatedKey: { id: 'w3' } })
            .resolvesOnce({ Items: widgets(4, 1) });

        const result = await list('Widgets', WidgetDto);

        expect(result.map((w) => w.id)).toEqual(['w0', 'w1', 'w2', 'w3', 'w4']);
        expect(result[0]).toBeInstanceOf(WidgetDto);

        const calls = ddb.commandCalls(ScanCommand);
        expect(calls).toHaveLength(3);
        expect(calls.map((c) => c.args[0].input.ExclusiveStartKey)).toEqual([
            undefined,
            { id: 'w1' },
            { id: 'w3' },
        ]);
        expect(calls.every((c) => c.args[0].input.TableName === 'Widgets')).toBe(true);
    });

    it('paginates Query calls and keeps the key condition on every page', async () => {
        ddb.on(QueryCommand)
            .resolvesOnce({ Items: widgets(0, 1), LastEvaluatedKey: { id: 'w0', sessionId: 's1' } })
            .resolvesOnce({ Items: [], LastEvaluatedKey: { id: 'w0b', sessionId: 's1' } })
            .resolvesOnce({ Items: widgets(1, 1) });

        const result = await list('Widgets', WidgetDto, {
            indexName: 'SessionIdIndex',
            keyConditionExpression: 'sessionId = :sid',
            expressionAttributeValues: { ':sid': 's1' },
        });

        expect(result.map((w) => w.id)).toEqual(['w0', 'w1']);
        const inputs = ddb.commandCalls(QueryCommand).map((c) => c.args[0].input);
        expect(inputs).toHaveLength(3);
        expect(inputs.map((i) => i.ExclusiveStartKey)).toEqual([
            undefined,
            { id: 'w0', sessionId: 's1' },
            { id: 'w0b', sessionId: 's1' },
        ]);
        for (const input of inputs) {
            expect(input.IndexName).toBe('SessionIdIndex');
            expect(input.KeyConditionExpression).toBe('sessionId = :sid');
            expect(input.ExpressionAttributeValues).toEqual({ ':sid': 's1' });
        }
    });

    it('caches the full multi-page result under the current table version', async () => {
        ddb.on(ScanCommand)
            .resolvesOnce({ Items: widgets(0, 1), LastEvaluatedKey: { id: 'w0' } })
            .resolvesOnce({ Items: widgets(1, 1) });

        await list('Widgets', WidgetDto);
        const second = await list('Widgets', WidgetDto);

        expect(second.map((w) => w.id)).toEqual(['w0', 'w1']);
        expect(ddb.commandCalls(ScanCommand)).toHaveLength(2);
    });
});
