// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2 } from 'aws-lambda';

const COOKIE_NAME = 'refreshToken';

// Must match the Cognito app client's refresh token expiration
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// Scoped to /auth only; SameSite=Lax for strict CSRF protection now that API & Frontend share kicks.ltd
export const buildRefreshCookie = (token: string): string =>
    `${COOKIE_NAME}=${token}; Path=/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=${REFRESH_TOKEN_MAX_AGE_SECONDS}`;

// Set-Cookie headers to purge all legacy variants (partitioned, root-path, or explicit domain)
export const clearLegacyCookies = (): string[] => [
    `${COOKIE_NAME}=; Path=/auth; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0`,
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0`,
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    `${COOKIE_NAME}=; Path=/auth; Domain=.kicks.ltd; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0`,
    `${COOKIE_NAME}=; Path=/auth; Domain=.kicks.ltd; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    `${COOKIE_NAME}=; Path=/auth; Domain=kicks.ltd; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0`,
    `${COOKIE_NAME}=; Path=/auth; Domain=kicks.ltd; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
];

// Clears all cookie variants including the current active one
export const clearRefreshCookies = (): string[] => [
    `${COOKIE_NAME}=; Path=/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    ...clearLegacyCookies(),
];

export const clearRefreshCookie = (): string =>
    `${COOKIE_NAME}=; Path=/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

// Extract all candidate tokens from both event.cookies and raw event.headers
export const extractRefreshCookies = (event: APIGatewayProxyEventV2): string[] => {
    const tokens: string[] = [];

    for (const c of event.cookies ?? []) {
        if (c.startsWith(`${COOKIE_NAME}=`)) {
            const val = c.slice(COOKIE_NAME.length + 1).trim();
            if (val && !tokens.includes(val)) {
                tokens.push(val);
            }
        }
    }

    const rawCookie = event.headers?.cookie ?? event.headers?.Cookie;
    if (rawCookie) {
        const parts = rawCookie.split(';');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.startsWith(`${COOKIE_NAME}=`)) {
                const val = trimmed.slice(COOKIE_NAME.length + 1).trim();
                if (val && !tokens.includes(val)) {
                    tokens.push(val);
                }
            }
        }
    }

    return tokens;
};

export const extractRefreshCookie = (event: APIGatewayProxyEventV2): string | undefined => {
    const tokens = extractRefreshCookies(event);
    return tokens[0];
};

export const isAllowedOrigin = (event: APIGatewayProxyEventV2): boolean => {
    const origin = event.headers?.origin ?? event.headers?.Origin;
    if (!origin) return true; // Non-browser or same-origin direct calls
    const allowedOrigins = [
        'https://kicks.ltd',
        'https://www.kicks.ltd',
        'http://localhost:5173',
        'http://localhost:3000',
    ];
    return allowedOrigins.includes(origin) || origin.endsWith('.kick-55w.pages.dev');
};

