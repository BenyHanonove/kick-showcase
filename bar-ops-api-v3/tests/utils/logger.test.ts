import { describe, expect, it, vi } from 'vitest';

import { logger, powertoolsLogger, sanitize } from '@utils/logger/logger.util';
import { tracer, traceClient } from '@utils/observability/tracer.util';

describe('sanitize', () => {
    it('masks sensitive keys at any depth', () => {
        expect(sanitize({ user: { email: 'a@b.co', phone: '050', name: 'Dana' }, refreshToken: 'x', Authorization: 'y' }))
            .toEqual({ user: { email: '[REDACTED]', phone: '[REDACTED]', name: 'Dana' }, refreshToken: '[REDACTED]', Authorization: '[REDACTED]' });
    });

    it('masks secrets embedded in free text', () => {
        const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl';
        expect(sanitize(`login dana@example.com with Bearer abc.def and ${jwt} key ${["AKIA", "ABCDEFGHIJKLMNOP"].join("")}`))
            .toBe('login [REDACTED] with [REDACTED] and [REDACTED] key [REDACTED]');
    });

    it('keeps Error shape, handles cycles and caps depth', () => {
        const err = new Error('failed for dana@example.com');
        expect(sanitize(err)).toMatchObject({ name: 'Error', message: 'failed for [REDACTED]' });

        const cyclic: Record<string, unknown> = { a: 1 };
        cyclic.self = cyclic;
        expect(sanitize(cyclic)).toEqual({ a: 1, self: '[CIRCULAR]' });

        const deep = { l1: { l2: { l3: { l4: { l5: { l6: { l7: { l8: 1 } } } } } } } };
        expect(JSON.stringify(sanitize(deep))).toContain('[TRUNCATED]');
    });
});

describe('logger (Powertools-backed, console-style API)', () => {
    it('uses the first string as the message and nests sanitized extras under details', () => {
        const spy = vi.spyOn(powertoolsLogger, 'info');
        logger.info('[link] 2. employee loaded', { firstName: 'Dana', phone: '0501234567' });
        expect(spy).toHaveBeenCalledWith('[link] 2. employee loaded', { details: { firstName: 'Dana', phone: '[REDACTED]' } });
    });

    it('logs a bare Error with its message and sanitized stack', () => {
        const spy = vi.spyOn(powertoolsLogger, 'error');
        logger.error(new Error('token eyJa.eyJb.c'));
        const [message, extra] = spy.mock.calls[0] as [string, { details: { name: string; message: string } }];
        expect(message).toBe('token [REDACTED]');
        expect(extra.details).toMatchObject({ name: 'Error', message: 'token [REDACTED]' });
    });

    it('collects multiple extras into an array and redacts the message itself', () => {
        const spy = vi.spyOn(powertoolsLogger, 'warn');
        logger.warn('mail to x@y.io failed:', 'retrying', { attempt: 2 });
        expect(spy).toHaveBeenCalledWith('mail to [REDACTED] failed:', { details: ['retrying', { attempt: 2 }] });
    });

    it('logs a plain message without an empty details key', () => {
        const spy = vi.spyOn(powertoolsLogger, 'info');
        logger.info('done');
        expect(spy).toHaveBeenCalledWith('done');
    });

    it('logs non-string, non-error values under details with an empty message', () => {
        const spy = vi.spyOn(powertoolsLogger, 'error');
        logger.error([{ property: 'name', constraints: { isString: 'name must be a string' } }]);
        expect(spy).toHaveBeenCalledWith('', { details: [{ property: 'name', constraints: { isString: 'name must be a string' } }] });
    });
});

describe('tracer', () => {
    it('is disabled outside Lambda / when POWERTOOLS_TRACE_ENABLED=false, so client capture is a no-op', () => {
        expect(tracer.isTracingEnabled()).toBe(false);
        const client = { send: () => 'ok' };
        expect(traceClient(client)).toBe(client);
    });
});
