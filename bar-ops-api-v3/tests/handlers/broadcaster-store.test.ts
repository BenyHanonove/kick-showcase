import { describe, expect, it } from 'vitest';

import { storeFromStreamArn } from '@functions/sockets/broadcaster/index';

const arn = (table: string) => `arn:aws:dynamodb:eu-west-1:123456789012:table/${table}/stream/2026-01-01T00:00:00.000`;

describe('storeFromStreamArn', () => {
    it.each([
        ['BarOps-Product', 'product'],
        ['dev-BarOps-Product', 'product'],
        ['pr-42-BarOps-ShiftToken', 'shifttoken'],
    ])('maps %s to %s', (table, store) => {
        expect(storeFromStreamArn(arn(table))).toBe(store);
    });

    it('returns an empty store for a missing ARN', () => {
        expect(storeFromStreamArn(undefined)).toBe('');
    });
});
