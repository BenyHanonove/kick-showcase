import { Logger } from '@aws-lambda-powertools/logger';

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

// Structured JSON logger. Service name, level and sampling come from the standard
// POWERTOOLS_SERVICE_NAME / POWERTOOLS_LOG_LEVEL / POWERTOOLS_LOGGER_SAMPLE_RATE env vars;
// POWERTOOLS_DEV=true pretty-prints locally. Handlers may also call
// powertoolsLogger.addContext(context) to stamp the request id on every line.
export const powertoolsLogger = new Logger({ serviceName: process.env.POWERTOOLS_SERVICE_NAME ?? 'kick-api' });

type Level = 'info' | 'warn' | 'error';

// Keep the console-style API every caller already uses (`logger.error('msg:', err)`,
// `logger.info('[x] step', { ... })`, `logger.error(err)`): the first string becomes the
// message, everything else is sanitized and nested under `details` so it can never
// overwrite Powertools' own keys (level, timestamp, service, xray_trace_id...).
const emit = (level: Level) => (...args: unknown[]): void => {
    const [first, ...rest] = args;
    let message: string;
    let extras: unknown[];

    if (typeof first === 'string') {
        message = sanitizeString(first);
        extras = rest;
    } else if (first instanceof Error) {
        message = sanitizeString(first.message);
        extras = args;
    } else {
        message = '';
        extras = args;
    }

    if (extras.length === 0) {
        powertoolsLogger[level](message);
        return;
    }

    const sanitized = extras.map((arg) => sanitize(arg));
    powertoolsLogger[level](message, { details: sanitized.length === 1 ? sanitized[0] : sanitized });
};

export const logger = {
    info: emit('info'),
    warn: emit('warn'),
    error: emit('error'),
};
