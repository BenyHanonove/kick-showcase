export interface Mapper {
    <T extends object>(data: T): Partial<T>;
    <T extends object>(data: T[]): Partial<T>[];
}

export const Mapper = (keysToDrop: string[]): Mapper => {
    return (<T extends object>(data: T | T[]): Partial<T> | Partial<T>[] => {
        if (!data) return data as Partial<T>;
        const drop = (item: T): Partial<T> => {
            const copy = { ...item };
            const record = copy as Record<string, object | string | number | boolean | null | undefined>;
            for (const key of keysToDrop) {
                delete record[key];
            }
            return copy;
        };
        return Array.isArray(data) ? data.map(drop) : drop(data);
    }) as Mapper;
};

// Helper to filter out inactive sessions for Managers.
export function filterActiveSessions<T extends { status?: string }>(data: T): T | null;
export function filterActiveSessions<T extends { status?: string }>(data: T[]): T[];
export function filterActiveSessions<T extends { status?: string }>(data: T | T[]): T | T[] | null {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.filter(item => item.status === 'active');
    }
    return data.status === 'active' ? data : null;
}
