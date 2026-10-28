import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { handler } from '@functions/employee/claim/index';
import { redisClient } from '@aws/redis/client.redis';
import { apiEvent, parseBody, statusOf, transactionCanceled } from '../helpers/events';

const ddb = mockClient(DynamoDBDocumentClient);
const EMPLOYEE_ID = '7a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const SEEN = '2026-10-01T10:00:00.000Z';

const details = {
    firstName: 'Dana',
    lastName: 'Levi',
    identityNumber: '123456789',
    phone: '0501234567',
    workExperience: '3 years',
    instagram: '@dana',
    address: 'Tel Aviv',
    gender: 'female',
    timestamp: SEEN,
};

const token = () => ({ token: 'tok-1', employeeId: EMPLOYEE_ID, used: false, expiresAt: Math.floor(Date.now() / 1000) + 3600 });
const savedEmployee = { ...details, id: EMPLOYEE_ID, status: 'APPROVED', timestamp: '2026-10-02T10:00:00.000Z', lastEditor: 'x' };

const claim = (body: unknown = { ...details, token: 'tok-1' }) => handler(apiEvent({ body }));

describe('employee/claim', () => {
    beforeEach(async () => {
        ddb.reset();
        await redisClient.flushall();
        process.env.TABLE = 'Employees';
        process.env.TOKEN_TABLE = 'EmployeeTokens';
        ddb.on(GetCommand, { TableName: 'EmployeeTokens' }).resolves({ Item: token() });
        ddb.on(GetCommand, { TableName: 'Employees' }).resolves({ Item: savedEmployee });
        ddb.on(TransactWriteCommand).resolves({});
    });

    it('spends the link and updates the employee atomically', async () => {
        const result = await claim();
        expect(statusOf(result)).toBe(200);
        expect(ddb.commandCalls(UpdateCommand)).toHaveLength(0);

        const [tokenUpdate, employeeUpdate] = ddb.commandCalls(TransactWriteCommand)[0].args[0].input.TransactItems!;
        expect(tokenUpdate.Update).toMatchObject({
            TableName: 'EmployeeTokens',
            Key: { token: 'tok-1' },
            ConditionExpression: 'used = :false AND expiresAt > :now AND employeeId = :employeeId',
        });
        expect(employeeUpdate.Update).toMatchObject({
            TableName: 'Employees',
            Key: { id: EMPLOYEE_ID },
            ConditionExpression: 'attribute_exists(id) AND (attribute_not_exists(#ts) OR #ts = :expectedTimestamp)',
        });
        expect(employeeUpdate.Update!.ExpressionAttributeValues![':expectedTimestamp']).toBe(SEEN);
        // The link token itself is never written onto the employee
        expect(Object.values(employeeUpdate.Update!.ExpressionAttributeNames!)).not.toContain('token');

        const data = parseBody(result).data as Record<string, unknown>;
        expect(data).toMatchObject({ id: EMPLOYEE_ID, firstName: 'Dana' });
        expect(data).not.toHaveProperty('lastEditor');
        expect(await redisClient.get('version:Employees')).toBe('1');
    });

    it('maps a token condition failure to the generic invalid-link 400', async () => {
        ddb.on(TransactWriteCommand).rejects(transactionCanceled('ConditionalCheckFailed', 'None'));
        expect(statusOf(await claim())).toBe(400);
    });

    it('maps a stale employee timestamp to 409 and does not spend the link', async () => {
        ddb.on(TransactWriteCommand).rejects(transactionCanceled('None', 'ConditionalCheckFailed'));
        const result = await claim();
        expect(statusOf(result)).toBe(409);
        // The whole transaction was cancelled, so used=true never landed: the link still works
    });

    it('maps a deleted employee to 404', async () => {
        ddb.on(TransactWriteCommand).rejects(transactionCanceled('None', 'ConditionalCheckFailed'));
        ddb.on(GetCommand, { TableName: 'Employees' }).resolves({});
        expect(statusOf(await claim())).toBe(404);
    });

    it('maps a TransactionConflict to 409', async () => {
        ddb.on(TransactWriteCommand).rejects(transactionCanceled('TransactionConflict', 'None'));
        expect(statusOf(await claim())).toBe(409);
    });

    it.each([
        ['missing', undefined],
        ['used', { ...token(), used: true }],
        ['expired', { ...token(), expiresAt: 1 }],
    ])('refuses a %s link with 400 before writing', async (_case, item) => {
        ddb.on(GetCommand, { TableName: 'EmployeeTokens' }).resolves({ Item: item });
        expect(statusOf(await claim())).toBe(400);
        expect(ddb.commandCalls(TransactWriteCommand)).toHaveLength(0);
    });
});
