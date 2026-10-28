// Import external framework dependencies and status codes from third party packages
import { AsyncLocalStorage } from 'async_hooks';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UserRole } from './user-role.enum';
import { StatusCodes } from 'http-status-codes';

type LambdaHandler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

// Global storage for the request context (holds editor Cognito sub)
export const contextStorage = new AsyncLocalStorage<{ editorId?: string }>();

// Normalize cognito:groups claim into a string array definition for application
export const normalizeGroups = (claim: unknown): string[] => {
    if (Array.isArray(claim)) return claim.filter((g): g is string => typeof g === 'string');
    if (typeof claim !== 'string' || claim.length === 0) return [];
    const trimmed = claim.startsWith('[') && claim.endsWith(']') ? claim.slice(1, -1) : claim;
    return trimmed.split(/[\s,]+/).filter(Boolean);
};

// Determine the highest user permission based on group hierarchy
export const getHighestRole = (groups: string[] = []): UserRole => {
    if (groups.includes(UserRole.ADMIN)) return UserRole.ADMIN;
    if (groups.includes(UserRole.MANAGER)) return UserRole.MANAGER;
    if (groups.includes(UserRole.USER)) return UserRole.USER;
    return UserRole.NONE;
};

// Helper to extract role from event definition for application business
export const getRoleFromEvent = (event: APIGatewayProxyEventV2): UserRole => {
    const context = event.requestContext as APIGatewayProxyEventV2['requestContext'] & {
        authorizer?: {
            jwt?: {
                claims?: {
                    'cognito:groups'?: string | string[];
                };
            };
        };
    };
    const claims = context.authorizer?.jwt?.claims;
    const groups = normalizeGroups(claims?.['cognito:groups']);
    return getHighestRole(groups);
};

// Protect routes by verifying Cognito JWT claims against allowed roles
export const RolesGuard = (allowedRoles: UserRole[], handler: LambdaHandler): LambdaHandler => {
    return async (event) => {
        // Extract authorization metadata from the request context configuration setting for
        const context = event.requestContext as APIGatewayProxyEventV2['requestContext'] & {
            authorizer?: {
                jwt?: {
                    claims?: {
                        sub?: string;
                        'cognito:groups'?: string | string[];
                    };
                };
            };
        };
        const claims = context.authorizer?.jwt?.claims;
        const groups = normalizeGroups(claims?.['cognito:groups']);
        const role = getHighestRole(groups);

        // Deny access if user role is not authorized
        if (!allowedRoles.includes(role)) {
            return {
                statusCode: StatusCodes.FORBIDDEN,
                body: JSON.stringify({ message: 'גישה נדחתה: אין לך הרשאות מתאימות לביצוע פעולה זו' })
            };
        }

        // Run handler with Cognito sub in context configuration setting for
        const editorId = claims?.sub;
        return contextStorage.run({ editorId }, () => handler(event));
    };
};