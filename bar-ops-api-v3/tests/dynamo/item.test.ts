import { describe, expect, it } from 'vitest';
import { ValidationError } from 'class-validator';

import { recombineDatetime, splitDatetime, stripStorageOnlyFields } from '@aws/dynamo/item.dynamo';

describe('splitDatetime', () => {
    it('splits a plain date into monthYear + numeric day and drops datetime', () => {
        expect(splitDatetime({ id: 'a', datetime: '2026-09-04' })).toEqual({ id: 'a', monthYear: '2026-09', day: 4 });
    });

    it('uses the calendar date as written, without shifting timezones', () => {
        // 23:30 at -05:00 is already the next day in UTC; the bucket stays on the written date
        expect(splitDatetime({ datetime: '2026-03-31T23:30:00-05:00' })).toEqual({ monthYear: '2026-03', day: 31 });
        // Midnight UTC that is still the previous evening in Israel stays on the UTC date
        expect(splitDatetime({ datetime: '2026-04-01T00:00:00.000Z' })).toEqual({ monthYear: '2026-04', day: 1 });
        expect(splitDatetime({ datetime: '2026-12-31T23:59:59.999+02:00' })).toEqual({ monthYear: '2026-12', day: 31 });
    });

    it('honours custom key names', () => {
        const keys = { datetimeKey: 'when', monthYearKey: 'my', dayKey: 'd' };
        expect(splitDatetime({ when: '2026-01-15', datetime: 'untouched' }, keys))
            .toEqual({ my: '2026-01', d: 15, datetime: 'untouched' });
    });

    it('leaves items without a string datetime untouched', () => {
        const item = { id: 'a', name: 'x' };
        expect(splitDatetime(item)).toBe(item);
        expect(splitDatetime({ datetime: 20260904 })).toEqual({ datetime: 20260904 });
        expect(splitDatetime({ datetime: null })).toEqual({ datetime: null });
    });

    it.each([
        '2026-09',          // ISO8601 reduced precision: used to become day 0
        '20260904',         // ISO8601 basic format: used to become monthYear "2026090"
        '2026-W36-5',       // ISO8601 week date
        '2026-13-01',
        '2026-02-00',
        '2026-09-04 10:00', // space separator is not ISO
        'not-a-date',
        '',
    ])('regression: rejects %j with a ValidationError instead of writing a garbage partition', (datetime) => {
        let thrown: unknown;
        try {
            splitDatetime({ datetime });
        } catch (err) {
            thrown = err;
        }
        expect(Array.isArray(thrown)).toBe(true);
        const [error] = thrown as ValidationError[];
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.property).toBe('datetime');
    });

    it('round-trips with recombineDatetime (date part only)', () => {
        const stored = splitDatetime({ id: 'a', datetime: '2026-02-03T18:00:00Z' });
        expect(recombineDatetime(stored)).toEqual({ id: 'a', datetime: '2026-02-03' });
    });
});

describe('recombineDatetime', () => {
    it('zero-pads the day', () => {
        expect(recombineDatetime({ monthYear: '2026-09', day: 4 })).toEqual({ datetime: '2026-09-04' });
    });

    it('does not overwrite an existing datetime or touch partial/mistyped pairs', () => {
        expect(recombineDatetime({ monthYear: '2026-09', day: 4, datetime: 'x' })).toEqual({ monthYear: '2026-09', day: 4, datetime: 'x' });
        expect(recombineDatetime({ monthYear: '2026-09' })).toEqual({ monthYear: '2026-09' });
        expect(recombineDatetime({ monthYear: '2026-09', day: '4' })).toEqual({ monthYear: '2026-09', day: '4' });
    });
});

describe('stripStorageOnlyFields', () => {
    it('removes lastEditor without mutating the input', () => {
        const item = { id: 'a', lastEditor: 'sub' };
        expect(stripStorageOnlyFields(item)).toEqual({ id: 'a' });
        expect(item).toHaveProperty('lastEditor');
    });
});
