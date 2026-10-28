import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import {
    DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { get } from '@aws/dynamo/get.dynamo';
import { list } from '@aws/dynamo/list.dynamo';
import { create } from '@aws/dynamo/create.dynamo';
import { update } from '@aws/dynamo/update.dynamo';
import { remove } from '@aws/dynamo/delete.dynamo';
import { redisClient, getRedisClient, getTableVersion } from '@aws/redis/client.redis';
import { WidgetDto } from '../helpers/fixtures';

const ddb = mockClient(DynamoDBDocumentClient);

describe('versioned Redis cache', () => {
    beforeEach(async () => {
        ddb.reset();
        await redisClient.flushall();
    });

    it('defaults the table version to "0" and folds it into get/list keys', async () => {
        ddb.on(GetCommand).resolves({ Item: { id: 'w1', name: 'A' } });
        ddb.on(ScanCommand).resolves({ Items: [{ id: 'w1', name: 'A' }] });

        await get('Widgets', 'w1', WidgetDto);
        await list('Widgets', WidgetDto);

        const keys = await redisClient.keys('*');
        expect(keys).toContain('get:Widgets:0:w1');
        expect(keys.some((k) => k.startsWith('list:Widgets:0:'))).toBe(true);
    });

    it('serves repeat reads from cache without touching DynamoDB', async () => {
        ddb.on(GetCommand).resolves({ Item: { id: 'w1', name: 'A' } });

        await get('Widgets', 'w1', WidgetDto);
        const again = await get('Widgets', 'w1', WidgetDto);

        expect(again).toMatchObject({ id: 'w1', name: 'A' });
        expect(again).toBeInstanceOf(WidgetDto);
        expect(ddb.commandCalls(GetCommand)).toHaveLength(1);
    });

    it.each([
        ['create', () => create('Widgets', { name: 'B' }, WidgetDto)],
        ['update', () => update('Widgets', 'w1', { name: 'B' }, WidgetDto)],
        ['remove', () => remove('Widgets', 'w1')],
    ])('a %s bumps the version so the next read misses the old key', async (_name, write) => {
        ddb.on(GetCommand).resolves({ Item: { id: 'w1', name: 'A' } });
        ddb.on(PutCommand).resolves({});
        ddb.on(UpdateCommand).resolves({ Attributes: { id: 'w1', name: 'B' } });
        ddb.on(DeleteCommand).resolves({ Attributes: { id: 'w1' } });

        await get('Widgets', 'w1', WidgetDto);
        await write();
        expect(await getTableVersion('Widgets')).toBe('1');

        await get('Widgets', 'w1', WidgetDto);
        expect(ddb.commandCalls(GetCommand)).toHaveLength(2);
    });

    it('a write invalidates cached list results too', async () => {
        ddb.on(ScanCommand)
            .resolvesOnce({ Items: [{ id: 'w1', name: 'A' }] })
            .resolvesOnce({ Items: [{ id: 'w1', name: 'A' }, { id: 'w2', name: 'B' }] });
        ddb.on(PutCommand).resolves({});

        expect(await list('Widgets', WidgetDto)).toHaveLength(1);
        await create('Widgets', { id: 'w2', name: 'B' }, WidgetDto);
        expect(await list('Widgets', WidgetDto)).toHaveLength(2);
    });

    it('a read racing a write files its result under the orphaned version', async () => {
        // The writer lands between the reader's version lookup and its DynamoDB read
        ddb.on(GetCommand).callsFakeOnce(async () => {
            await redisClient.incr('version:Widgets');
            return { Item: { id: 'w1', name: 'stale' } };
        }).resolves({ Item: { id: 'w1', name: 'fresh' } });

        await get('Widgets', 'w1', WidgetDto);
        expect(await redisClient.get('get:Widgets:0:w1')).toContain('stale');

        const next = await get('Widgets', 'w1', WidgetDto);
        expect(next?.name).toBe('fresh');
    });

    it('regression: writers never prime the cache, so an out-of-order INCR cannot pin an older copy', async () => {
        // Two updates to the same row: A's DynamoDB write lands first, B's second,
        // but A's INCR runs last. Priming would have cached A's (older) value under
        // the newest version; with invalidate-only writers the next read goes to DynamoDB.
        ddb.on(UpdateCommand).resolves({ Attributes: { id: 'w1', name: 'A' } });
        await update('Widgets', 'w1', { name: 'A' }, WidgetDto);
        await update('Widgets', 'w1', { name: 'B' }, WidgetDto);

        expect(await redisClient.keys('get:*')).toEqual([]);
        ddb.on(GetCommand).resolves({ Item: { id: 'w1', name: 'B' } });
        expect((await get('Widgets', 'w1', WidgetDto))?.name).toBe('B');
    });

    it('regression: lastEditor never reaches get/list responses or the cache', async () => {
        ddb.on(GetCommand).resolves({ Item: { id: 'w1', name: 'A', lastEditor: 'sub-1' } });
        ddb.on(ScanCommand).resolves({ Items: [{ id: 'w1', name: 'A', lastEditor: 'sub-1' }] });

        expect(await get('Widgets', 'w1', WidgetDto)).not.toHaveProperty('lastEditor');
        expect((await list('Widgets', WidgetDto))[0]).not.toHaveProperty('lastEditor');
        for (const key of await redisClient.keys('*:Widgets:*')) {
            expect(await redisClient.get(key)).not.toContain('sub-1');
        }
    });

    it('falls through to DynamoDB when Redis is down', async () => {
        const client = await getRedisClient();
        const failing = vi.spyOn(client, 'get').mockRejectedValue(new Error('ECONNREFUSED'));
        vi.spyOn(client, 'set').mockRejectedValue(new Error('ECONNREFUSED'));
        ddb.on(GetCommand).resolves({ Item: { id: 'w1', name: 'A' } });

        expect(await get('Widgets', 'w1', WidgetDto)).toMatchObject({ id: 'w1' });
        expect(failing).toHaveBeenCalled();
        expect(ddb.commandCalls(GetCommand)).toHaveLength(1);
    });
});
