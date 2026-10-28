import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { BatchWriteCommand, DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';
import { redisClient } from '@aws/redis/client.redis';

const ddb = mockClient(DynamoDBDocumentClient);

describe('cascadeDeleteByField()', () => {
    beforeEach(async () => {
        ddb.reset();
        await redisClient.flushall();
    });

    it('deletes children from every Query page, in batches of 25, and bumps the cache version', async () => {
        const page = (from: number, n: number) => Array.from({ length: n }, (_, i) => ({ id: `c${from + i}` }));
        ddb.on(QueryCommand)
            .resolvesOnce({ Items: page(0, 20), LastEvaluatedKey: { id: 'c19' } })
            .resolvesOnce({ Items: page(20, 10) });
        ddb.on(BatchWriteCommand).resolves({ UnprocessedItems: {} });

        const deleted = await cascadeDeleteByField('Tips', 'SessionIdIndex', 'sessionId', 's1');

        expect(deleted).toBe(30);
        expect(ddb.commandCalls(QueryCommand)[1].args[0].input.ExclusiveStartKey).toEqual({ id: 'c19' });
        const batches = ddb.commandCalls(BatchWriteCommand).map((c) => c.args[0].input.RequestItems!.Tips.length);
        expect(batches).toEqual([25, 5]);
        expect(await redisClient.get('version:Tips')).toBe('1');
    });

    it('returns 0 and writes nothing when there are no children', async () => {
        ddb.on(QueryCommand).resolves({ Items: [] });
        expect(await cascadeDeleteByField('Tips', 'SessionIdIndex', 'sessionId', 's1')).toBe(0);
        expect(ddb.commandCalls(BatchWriteCommand)).toHaveLength(0);
    });
});
