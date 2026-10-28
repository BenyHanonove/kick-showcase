import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { update, ConcurrencyConflictError } from '@aws/dynamo/update.dynamo';
import { redisClient } from '@aws/redis/client.redis';
import { contextStorage } from '@guards/role.guard';
import { handler as updateProduct } from '@functions/product/update/index';
import { WidgetDto } from '../helpers/fixtures';
import { apiEvent, conditionalCheckFailed, parseBody, statusOf } from '../helpers/events';

const ddb = mockClient(DynamoDBDocumentClient);
const SEEN = '2026-10-01T10:00:00.000Z';

describe('update() optimistic locking', () => {
    beforeEach(async () => {
        ddb.reset();
        await redisClient.flushall();
    });

    it('conditions the write on the timestamp the client last saw', async () => {
        ddb.on(UpdateCommand).resolves({ Attributes: { id: 'w1', name: 'New', timestamp: '2026-10-02T00:00:00.000Z' } });

        await update('Widgets', 'w1', { name: 'New', timestamp: SEEN }, WidgetDto);

        const input = ddb.commandCalls(UpdateCommand)[0].args[0].input;
        expect(input.ConditionExpression).toBe('attribute_exists(id) AND (attribute_not_exists(#ts) OR #ts = :expectedTimestamp)');
        expect(input.ExpressionAttributeNames!['#ts']).toBe('timestamp');
        expect(input.ExpressionAttributeValues![':expectedTimestamp']).toBe(SEEN);
        // The client's stale timestamp is only a precondition: the SET writes a fresh one
        const setValues = Object.entries(input.ExpressionAttributeValues!).filter(([k]) => k.startsWith(':v'));
        expect(setValues.map(([, v]) => v)).not.toContain(SEEN);
        expect(Object.values(input.ExpressionAttributeNames!)).not.toContain('id');
    });

    it('only requires existence when no timestamp is sent', async () => {
        ddb.on(UpdateCommand).resolves({ Attributes: { id: 'w1', name: 'New' } });
        await update('Widgets', 'w1', { name: 'New' }, WidgetDto);
        expect(ddb.commandCalls(UpdateCommand)[0].args[0].input.ConditionExpression).toBe('attribute_exists(id)');
    });

    it('throws ConcurrencyConflictError when the row exists but the timestamp moved on', async () => {
        ddb.on(UpdateCommand).rejects(conditionalCheckFailed());
        ddb.on(GetCommand).resolves({ Item: { id: 'w1', name: 'Other', timestamp: '2026-10-01T11:00:00.000Z' } });

        await expect(update('Widgets', 'w1', { name: 'New', timestamp: SEEN }, WidgetDto))
            .rejects.toBeInstanceOf(ConcurrencyConflictError);
        expect(await redisClient.get('version:Widgets')).toBeNull();
    });

    it('returns null (404) when the condition failed because the row is gone', async () => {
        ddb.on(UpdateCommand).rejects(conditionalCheckFailed());
        ddb.on(GetCommand).resolves({});

        await expect(update('Widgets', 'w1', { name: 'New', timestamp: SEEN }, WidgetDto)).resolves.toBeNull();
    });

    it('rethrows unrelated DynamoDB errors untouched', async () => {
        ddb.on(UpdateCommand).rejects(Object.assign(new Error('throttled'), { name: 'ProvisionedThroughputExceededException' }));
        await expect(update('Widgets', 'w1', { name: 'New' }, WidgetDto)).rejects.toThrow('throttled');
        expect(ddb.commandCalls(GetCommand)).toHaveLength(0);
    });

    it('stamps lastEditor in the table but strips it from the response', async () => {
        ddb.on(UpdateCommand).resolves({ Attributes: { id: 'w1', name: 'New', lastEditor: 'sub-1' } });

        const result = await contextStorage.run({ editorId: 'sub-1' }, () =>
            update('Widgets', 'w1', { name: 'New' }, WidgetDto));

        const input = ddb.commandCalls(UpdateCommand)[0].args[0].input;
        expect(Object.values(input.ExpressionAttributeNames!)).toContain('lastEditor');
        expect(result).not.toHaveProperty('lastEditor');
    });
});

describe('product/update handler', () => {
    beforeEach(async () => {
        ddb.reset();
        await redisClient.flushall();
        process.env.TABLE = 'Products';
    });

    const event = () => apiEvent({
        groups: ['Admin'],
        sub: 'admin-sub',
        pathParameters: { id: 'p1' },
        body: { name: 'Gin', timestamp: SEEN },
    });

    it('maps a stale timestamp to HTTP 409', async () => {
        ddb.on(UpdateCommand).rejects(conditionalCheckFailed());
        ddb.on(GetCommand).resolves({ Item: { id: 'p1', timestamp: '2026-10-01T11:00:00.000Z' } });

        const result = await updateProduct(event());
        expect(statusOf(result)).toBe(409);
        expect(parseBody(result).message).toBeTruthy();
    });

    it('maps a missing row to HTTP 404', async () => {
        ddb.on(UpdateCommand).rejects(conditionalCheckFailed());
        ddb.on(GetCommand).resolves({});

        expect(statusOf(await updateProduct(event()))).toBe(404);
    });
});
