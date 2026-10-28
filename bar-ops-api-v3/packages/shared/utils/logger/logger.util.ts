const REDACTED = '[REDACTED]';

const MAX_DEPTH = 6;

// Key names whose values are always fully masked
const SENSITIVE_KEY_PATTERN = /password|passwd|secret|token|authorization|auth|apikey|api[-_]key|credential|cookie|jwt|signature|challengeanswer|secretlogincode|privatekey|accesskey|email|phone/i;

const SENSITIVE_VALUE_PATTERNS: RegExp[] = [
    /\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g,
    /\b(Bearer|Basic)\s+[\w.~+/=-]+/gi,
    /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g,
    /\bAKIA[0-9A-Z]{16}\b/g,
];

// Mask sensitive patterns inside a string value
const sanitizeString = (value: string): string =>
    SENSITIVE_VALUE_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, REDACTED), value);

// Deeply sanitize any value before it reaches CloudWatch
export const sanitize = (value: unknown, depth: number = 0, seen: WeakSet<object> = new WeakSet()): unknown => {
    if (depth > MAX_DEPTH) return '[TRUNCATED]';
    if (typeof value === 'string') return sanitizeString(value);
    if (value === null || typeof value !== 'object') return value;

    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);

    // Preserve Error shape while sanitizing its text
    if (value instanceof Error) {
        return {
            name: value.name,
            message: sanitizeString(value.message),
            stack: value.stack ? sanitizeString(value.stack) : undefined,
        };
    }

    if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1, seen));

    // Mask values of sensitive keys, recurse into the rest
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
        result[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : sanitize(val, depth + 1, seen);
    }
    return result;
};

// Sanitize all arguments before delegating to console
const emit = (method: 'log' | 'warn' | 'error') => (...args: unknown[]): void => {
    console[method](...args.map((arg) => sanitize(arg)));
};

export const logger = {
    info: emit('log'),
    warn: emit('warn'),
    error: emit('error'),
};
