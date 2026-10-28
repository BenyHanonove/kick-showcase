import { ValidationError } from "class-validator";

export type DynamoAttributeValue = string | number | boolean | object | null | undefined;

// A raw DynamoDB item: attribute name -> attribute value
export type DynamoItem = Record<string, DynamoAttributeValue>;

// Field names for the split-datetime GSI pattern, overridable per call so a table
// with different attribute names can reuse the same helpers.
export interface DateSplitKeys {
    monthYearKey?: string; // default 'monthYear'
    dayKey?: string;       // default 'day'
    datetimeKey?: string;  // default 'datetime'
}

// True when an item carries a split monthYear/day pair that has not been recombined yet
const hasSplitDatetime = (item: DynamoItem, keys: DateSplitKeys = {}): boolean => {
    const { monthYearKey = 'monthYear', dayKey = 'day', datetimeKey = 'datetime' } = keys;
    return (
        monthYearKey in item &&
        dayKey in item &&
        !(datetimeKey in item) &&
        typeof item[monthYearKey] === 'string' &&
        typeof item[dayKey] === 'number'
    );
};

// Recombine monthYear/day into a synthetic datetime field (session/sale)
export const recombineDatetime = (item: DynamoItem, keys: DateSplitKeys = {}): DynamoItem => {
    const { monthYearKey = 'monthYear', dayKey = 'day', datetimeKey = 'datetime' } = keys;

    if (hasSplitDatetime(item, keys)) {
        const rest = { ...item };
        const monthYear = rest[monthYearKey] as string;
        const day = rest[dayKey] as number;
        delete rest[monthYearKey];
        delete rest[dayKey];
        return { ...rest, [datetimeKey]: `${monthYear}-${String(day).padStart(2, '0')}` };
    }

    return item;
};

// Split a datetime field into monthYear/day for GSI partitioning, dropping datetime
export const splitDatetime = (item: DynamoItem, keys: DateSplitKeys = {}): DynamoItem => {
    const { monthYearKey = 'monthYear', dayKey = 'day', datetimeKey = 'datetime' } = keys;
    const datetime = item[datetimeKey];
    if (typeof datetime !== 'string') return item;

    // The partition key is the calendar date exactly as written (no timezone shift).
    // @IsISO8601 also accepts forms like "2026-03", "20260305" or "2026-W10-1", which
    // slicing would turn into a garbage monthYear or day 0, so require YYYY-MM-DD up front.
    const match = DATE_PREFIX.exec(datetime);
    if (!match) {
        const error = new ValidationError();
        error.property = datetimeKey;
        error.value = datetime;
        error.constraints = { isCalendarDate: `${datetimeKey} must start with a YYYY-MM-DD calendar date` };
        throw [error];
    }

    const rest = { ...item };
    delete rest[datetimeKey];

    return { ...rest, [monthYearKey]: match[1], [dayKey]: Number(match[2]) };
};

const DATE_PREFIX = /^(\d{4}-(?:0[1-9]|1[0-2]))-(0[1-9]|[12]\d|3[01])(?:$|T)/;

// Audit-only attributes that live in the table but must never reach an API response
const STORAGE_ONLY_FIELDS = ['lastEditor'] as const;

export const stripStorageOnlyFields = (item: DynamoItem): DynamoItem => {
    const rest = { ...item };
    for (const field of STORAGE_ONLY_FIELDS) delete rest[field];
    return rest;
};
