import { normalizeGroups } from '@guards/role.guard';

interface IdTokenClaims {
    email: string;
    given_name?: string;
    family_name?: string;
    'cognito:groups'?: string | string[];
}

// Safe: token is Cognito's own same-request response
export const decodeIdToken = (idToken: string): IdTokenClaims =>
    JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8'));

// Build frontend IUser shape from a fresh ID token
export const buildUserFromIdToken = (idToken: string) => {
    const claims = decodeIdToken(idToken);
    return {
        email: claims.email,
        firstName: claims.given_name,
        lastName: claims.family_name,
        groups: normalizeGroups(claims['cognito:groups']),
    };
};
