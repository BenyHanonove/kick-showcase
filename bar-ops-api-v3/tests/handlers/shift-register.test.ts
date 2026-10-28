import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import {
    DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';

import { handler } from '@functions/shift/register/index';
import { redisClient } from '@aws/redis/client.redis';
import { deterministicId } from '@utils/id/deterministic-id.util';
import { apiEvent, parseBody, statusOf, transactionCanceled } from '../helpers/events';

const ddb = mockClient(DynamoDBDocumentClient);
const SESSION_ID = '0b6f8f3e-6d0e-4c43-9d4a-8f0d3d9c2a11';
const EMPLOYEE_ID = '7a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

const validToken = () => ({
    token: 'tok-1',
    sessionId: SESSION_ID,
    employeeId: EMPLOYEE_ID,
    used: false,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
});

const register = (body: unknown = { token: 'tok-1', role: 'bartender', notes: 'free all night' }) =>
    handler(apiEvent({ body }));

describe('shift/register', () => {
    beforeEach(async () => {
        ddb.reset();
        await redisClient.flushall();
        process.env.TABLE = 'Shifts';
        process.env.TOKEN_TABLE = 'ShiftTokens';
        ddb.on(GetCommand).resolves({ Item: validToken() });
        ddb.on(QueryCommand).resolves({ Items: [] });
        ddb.on(TransactWriteCommand).resolves({});
    });

    it('consumes the link and creates the shift in a single transaction', async () => {
        const result = await register();
        expect(statusOf(result)).toBe(201);

        expect(ddb.commandCalls(DeleteCommand)).toHaveLength(0);
        expect(ddb.commandCalls(PutCommand)).toHaveLength(0);

        const [call] = ddb.commandCalls(TransactWriteCommand);
        const [del, put] = call.args[0].input.TransactItems!;
        expect(del.Delete).toMatchObject({
            TableName: 'ShiftTokens',
            Key: { token: 'tok-1' },
            ConditionExpression: 'attribute_exists(#token) AND #used = :false AND expiresAt > :now',
        });
        expect(put.Put).toMatchObject({
            TableName: 'Shifts',
            ConditionExpression: 'attribute_not_exists(id)',
            Item: {
                id: deterministicId('shift-registration', SESSION_ID, EMPLOYEE_ID),
                sessionId: SESSION_ID,
                employeeId: EMPLOYEE_ID,
                role: 'bartender',
                registration: 'PENDING',
                approved: false,
            },
        });
        expect(parseBody(result).data).toEqual({ id: put.Put!.Item!.id, role: 'bartender' });
        expect(await redisClient.get('version:Shifts')).toBe('1');
    });

    it('takes session and employee from the token row, never from the request', async () => {
        await register({ token: 'tok-1', role: 'waiter', sessionId: 'evil', employeeId: 'evil' });
        const put = ddb.commandCalls(TransactWriteCommand)[0].args[0].input.TransactItems![1].Put!;
        expect(put.Item).toMatchObject({ sessionId: SESSION_ID, employeeId: EMPLOYEE_ID });
    });

    it('maps a token condition failure (spent/expired mid-flight) to the generic invalid-link 400', async () => {
        ddb.on(TransactWriteCommand).rejects(transactionCanceled('ConditionalCheckFailed', 'None'));
        const result = await register();
        expect(statusOf(result)).toBe(400);
        expect(parseBody(result).message).toBe('הקישור אינו תקין או שפג תוקפו');
    });

    it('maps a shift condition failure (concurrent registration on another link) to 409 already registered', async () => {
        ddb.on(TransactWriteCommand).rejects(transactionCanceled('None', 'ConditionalCheckFailed'));
        const result = await register();
        expect(statusOf(result)).toBe(409);
        expect(parseBody(result).message).toBe('כבר שובצת לאירוע זה');
    });

    it('maps a TransactionConflict (same link submitted twice at once) to 409', async () => {
        ddb.on(TransactWriteCommand).rejects(transactionCanceled('TransactionConflict', 'None'));
        expect(statusOf(await register())).toBe(409);
    });

    it('returns 409 and leaves the link intact when the employee is already staffed', async () => {
        ddb.on(QueryCommand).resolves({ Items: [{
            id: '5d3a1f0e-2b4c-4d6e-8f0a-1b2c3d4e5f60', sessionId: SESSION_ID, employeeId: EMPLOYEE_ID,
            role: 'waiter', totalHours: 0, received: false, approved: true, registration: 'APPROVED',
            timestamp: '2026-10-01T10:00:00.000Z',
        }] });
        expect(statusOf(await register())).toBe(409);
        expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    });

    it.each([
        ['missing', undefined],
        ['already used', { ...validToken(), used: true }],
        ['expired', { ...validToken(), expiresAt: Math.floor(Date.now() / 1000) - 1 }],
    ])('refuses a %s token with 400 and writes nothing', async (_case, item) => {
        ddb.on(GetCommand).resolves({ Item: item });
        expect(statusOf(await register())).toBe(400);
        expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    });

    it('refuses an invalid body without reading the token', async () => {
        expect(statusOf(await register({ token: 'tok-1', role: 'astronaut' }))).toBe(400);
        expect(ddb.commandCalls(GetCommand)).toHaveLength(0);
    });

    it('returns 500 on unexpected DynamoDB errors', async () => {
        ddb.on(TransactWriteCommand).rejects(new Error('ServiceUnavailable'));
        expect(statusOf(await register())).toBe(500);
    });
});
