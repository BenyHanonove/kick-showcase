import { describe, expect, it, vi } from 'vitest';
import { type APIGatewayProxyEventV2 } from 'aws-lambda';

import { RolesGuard, contextStorage, getHighestRole, getRoleFromEvent, normalizeGroups } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { apiEvent, statusOf } from '../helpers/events';

const ok = vi.fn(async () => ({ statusCode: 200, body: '{}' }));

describe('normalizeGroups', () => {
    it.each([
        [['Admin', 'Users'], ['Admin', 'Users']],
        ['Admin', ['Admin']],
        ['Admin,Users', ['Admin', 'Users']],
        ['[Admin Users]', ['Admin', 'Users']],
        ['[Manager, Users]', ['Manager', 'Users']],
        ['', []],
        [undefined, []],
        [42, []],
        [['Admin', 7, null], ['Admin']],
    ])('%j -> %j', (claim, expected) => {
        expect(normalizeGroups(claim)).toEqual(expected);
    });
});

describe('getHighestRole', () => {
    it('picks the strongest group regardless of order', () => {
        expect(getHighestRole(['Users', 'Admin', 'Manager'])).toBe(UserRole.ADMIN);
        expect(getHighestRole(['Users', 'Manager'])).toBe(UserRole.MANAGER);
        expect(getHighestRole(['Users'])).toBe(UserRole.USER);
    });

    it('fails closed to NONE for no or unknown groups', () => {
        expect(getHighestRole()).toBe(UserRole.NONE);
        expect(getHighestRole(['admin', 'Superuser', 'None'])).toBe(UserRole.NONE);
    });

    it('getRoleFromEvent reads the JWT claim', () => {
        expect(getRoleFromEvent(apiEvent({ groups: '[Manager]' }))).toBe(UserRole.MANAGER);
        expect(getRoleFromEvent(apiEvent())).toBe(UserRole.NONE);
    });
});

describe('RolesGuard', () => {
    const adminOnly = RolesGuard([UserRole.ADMIN], ok);
    const adminOrManager = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], ok);
    const staff = RolesGuard([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER], ok);

    // Rows: caller's groups. Columns: the three guard shapes used in the codebase.
    it.each([
        ['Admin', 200, 200, 200],
        ['Manager', 403, 200, 200],
        ['Users', 403, 403, 200],
        ['Users,Manager', 403, 200, 200],
    ])('caller in %s -> admin-only %i, admin+manager %i, staff %i', async (groups, a, am, s) => {
        const event = apiEvent({ groups, sub: 'sub-1' });
        expect(statusOf(await adminOnly(event))).toBe(a);
        expect(statusOf(await adminOrManager(event))).toBe(am);
        expect(statusOf(await staff(event))).toBe(s);
    });

    it.each([
        ['no authorizer at all', apiEvent()],
        ['claims without groups', apiEvent({ sub: 'sub-1' })],
        ['an unknown group', apiEvent({ groups: ['Owner'] })],
        ['a lower-case lookalike', apiEvent({ groups: 'admin' })],
        ['an empty group string', apiEvent({ groups: '' })],
        ['regression: no requestContext (used to throw -> 500)', { body: '{}' } as unknown as APIGatewayProxyEventV2],
    ])('denies %s with 403 and never runs the handler', async (_case, event) => {
        ok.mockClear();
        const result = await staff(event);
        expect(statusOf(result)).toBe(403);
        expect(ok).not.toHaveBeenCalled();
    });

    it('denies a role that is not explicitly listed, even a stronger one (no implicit hierarchy)', async () => {
        const managerOnly = RolesGuard([UserRole.MANAGER], ok);
        expect(statusOf(await managerOnly(apiEvent({ groups: 'Admin' })))).toBe(403);
    });

    it('runs the handler with the Cognito sub as editorId', async () => {
        let seen: string | undefined;
        const guarded = RolesGuard([UserRole.ADMIN], async () => {
            seen = contextStorage.getStore()?.editorId;
            return { statusCode: 200 };
        });
        await guarded(apiEvent({ groups: 'Admin', sub: 'sub-42' }));
        expect(seen).toBe('sub-42');
        expect(contextStorage.getStore()).toBeUndefined();
    });
});
