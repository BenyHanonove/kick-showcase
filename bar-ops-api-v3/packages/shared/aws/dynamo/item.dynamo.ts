export type DynamoAttributeValue = string | number | boolean | object | null | undefined;

// A raw DynamoDB item: attribute name -> attribute value
export type DynamoItem = Record<string, DynamoAttributeValue>;

// Field names for the split-datetime GSI pattern, all overridable per
// nothing here is baked into a fixed list, so a
export interface DateSplitKeys {
    monthYearKey?: string; // default 'monthYear'
    dayKey?: string;       // default 'day'
    datetimeKey?: string;  // default 'datetime'
}

// True when an item carries a split monthYear/day pair that
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

    const rest = { ...item };
    delete rest[datetimeKey];

    return { ...rest, [monthYearKey]: datetime.slice(0, 7), [dayKey]: Number(datetime.slice(8, 10)) };
};
