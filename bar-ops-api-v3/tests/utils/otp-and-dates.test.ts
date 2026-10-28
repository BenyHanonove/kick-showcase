import { describe, expect, it } from 'vitest';

import { generateOtp, isOtpEqual } from '@utils/token/otp.util';
import { getDateRangeBuckets } from '@utils/date/date-range.util';

describe('OTP helpers', () => {
    it('generates zero-padded 4-digit codes', () => {
        for (let i = 0; i < 200; i++) expect(generateOtp()).toMatch(/^\d{4}$/);
    });

    it('compares in constant time and handles length mismatch without throwing', () => {
        expect(isOtpEqual('0042', '0042')).toBe(true);
        expect(isOtpEqual('0042', '0043')).toBe(false);
        expect(isOtpEqual('0042', '042')).toBe(false);
        expect(isOtpEqual('', '0042')).toBe(false);
    });
});

describe('getDateRangeBuckets', () => {
    it('returns a single bucket inside one month', () => {
        expect(getDateRangeBuckets('2026-09-04', '2026-09-20')).toEqual([{ monthYear: '2026-09', dayStart: 4, dayEnd: 20 }]);
    });

    it('splits across a year boundary with open-ended middle months', () => {
        expect(getDateRangeBuckets('2026-11-15', '2027-01-03')).toEqual([
            { monthYear: '2026-11', dayStart: 15, dayEnd: 31 },
            { monthYear: '2026-12', dayStart: 1, dayEnd: 31 },
            { monthYear: '2027-01', dayStart: 1, dayEnd: 3 },
        ]);
    });

    it('returns nothing when the range is inverted', () => {
        expect(getDateRangeBuckets('2026-10-01', '2026-09-01')).toEqual([]);
    });
});
