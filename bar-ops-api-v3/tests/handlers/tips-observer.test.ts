import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { type DynamoDBRecord, type EventBridgeEvent } from 'aws-lambda';
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

import { lambdaHandler } from '@functions/tips/observer/index';
import { redisClient } from '@aws/redis/client.redis';
import { conditionalCheckFailed } from '../helpers/events';

const ddb = mockClient(DynamoDBDocumentClient);
const SESSION_ID = '0b6f8f3e-6d0e-4c43-9d4a-8f0d3d9c2a11';

const sessionEvent = (eventName: 'INSERT' | 'REMOVE', id = SESSION_ID) => ({
    detail: {
        eventName,
        eventSourceARN: 'arn:aws:dynamodb:eu-west-1:123456789012:table/BarOps-Session/stream/2026',
        dynamodb: { Keys: { id: { S: id } } },
    },
}) as unknown as EventBridgeEvent<string, DynamoDBRecord>;

describe('tips observer idempotency', () => {
    // Stateful fake of the Tips table honouring attribute_not_exists(id)
    let table: Map<string, Record<string, unknown>>;

    beforeEach(async () => {
        ddb.reset();
        await redisClient.flushall();
        process.env.TABLE = 'Tips';
        table = new Map();
        ddb.on(PutCommand).callsFake(async (input) => {
            const id = input.Item.id as string;
            if (input.ConditionExpression === 'attribute_not_exists(id)' && table.has(id)) {
                throw conditionalCheckFailed();
            }
            table.set(id, input.Item);
            return {};
        });
    });

    it('seeds exactly one bar and one tables row per session', async () => {
        await lambdaHandler(sessionEvent('INSERT'));

        expect([...table.values()].map((r) => r.area).sort()).toEqual(['bar', 'tables']);
        expect(await redisClient.get('version:Tips')).toBe('1');
        for (const call of ddb.commandCalls(PutCommand)) {
            expect(call.args[0].input.ConditionExpression).toBe('attribute_not_exists(id)');
        }
    });

    it('regression: a redelivered INSERT does not create duplicate rows (used to create 4)', async () => {
        await lambdaHandler(sessionEvent('INSERT'));
        await lambdaHandler(sessionEvent('INSERT'));
        await lambdaHandler(sessionEvent('INSERT'));

        expect(table.size).toBe(2);
        // Duplicate deliveries succeed (no retry storm) and do not churn the cache
        expect(await redisClient.get('version:Tips')).toBe('1');
    });

    it('recovers a partially applied delivery: the retry writes only the missing row', async () => {
        let calls = 0;
        ddb.on(PutCommand).callsFake(async (input) => {
            calls++;
            if (calls === 2) throw new Error('Lambda timed out mid-batch');
            const id = input.Item.id as string;
            if (table.has(id)) throw conditionalCheckFailed();
            table.set(id, input.Item);
            return {};
        });

        await expect(lambdaHandler(sessionEvent('INSERT'))).rejects.toThrow('timed out');
        expect(table.size).toBe(1);

        await lambdaHandler(sessionEvent('INSERT'));
        expect(table.size).toBe(2);
    });

    it('derives ids from the session, so different sessions never collide', async () => {
        await lambdaHandler(sessionEvent('INSERT'));
        await lambdaHandler(sessionEvent('INSERT', '1c9d7a52-3c44-4c8e-b0a2-5e1f7b6d9e00'));
        expect(table.size).toBe(4);
        for (const id of table.keys()) expect(id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('propagates unexpected write errors so EventBridge retries', async () => {
        ddb.on(PutCommand).rejects(new Error('AccessDenied'));
        await expect(lambdaHandler(sessionEvent('INSERT'))).rejects.toThrow('AccessDenied');
    });

    it('cascades REMOVE to the session tips', async () => {
        ddb.on(QueryCommand).resolves({ Items: [{ id: 'a' }, { id: 'b' }] });
        ddb.on(BatchWriteCommand).resolves({});
        await lambdaHandler(sessionEvent('REMOVE'));
        expect(ddb.commandCalls(QueryCommand)[0].args[0].input.ExpressionAttributeValues).toEqual({ ':val': SESSION_ID });
        expect(ddb.commandCalls(BatchWriteCommand)).toHaveLength(1);
    });

    it('ignores records from other tables', async () => {
        const event = sessionEvent('INSERT');
        event.detail.eventSourceARN = 'arn:aws:dynamodb:eu-west-1:123456789012:table/BarOps-Sale/stream/2026';
        await lambdaHandler(event);
        expect(ddb.calls()).toHaveLength(0);
    });
});
