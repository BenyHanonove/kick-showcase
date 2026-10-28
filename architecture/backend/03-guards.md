# Layer 3 — Guards & identity

**Files:** [`packages/shared/guards/role.guard.ts`](../../bar-ops-api-v3/packages/shared/guards/role.guard.ts) ·
`packages/shared/guards/user-role.enum.ts`

## Two checkpoints

1. **API Gateway JWT authorizer** (console-configured) validates the Cognito access
   token before the Lambda runs. No token → `401`, and your handler never executes.
2. **`RolesGuard`** inside the Lambda checks the `cognito:groups` claim against the
   roles you allow → `403` with a Hebrew message.

## Roles

`UserRole` = `ADMIN` › `MANAGER` › `USER` › `NONE`. Roles are **Cognito groups**, not
database fields. `getHighestRole()` picks the strongest group a user belongs to;
`normalizeGroups()` tolerates the claim arriving as an array, a comma/space list, or a
`[bracketed]` string.

```ts
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (event) => { … });
```

Typical distribution in this codebase: writes are `ADMIN` (sometimes `ADMIN, MANAGER`),
reads are `ADMIN, MANAGER`, and operational endpoints staff actually use during a shift
add `USER`.

## Request context — who edited what

`RolesGuard` runs the handler inside an `AsyncLocalStorage` store holding the Cognito
`sub`:

```ts
return contextStorage.run({ editorId: claims?.sub }, () => handler(event));
```

The `create`/`update` data helpers read that store and stamp `lastEditor` onto the
DynamoDB item — then **strip it from the response**, so the audit trail exists in the
table without ever reaching the client. You get this for free by using the helpers;
you get nothing if you write to Dynamo directly.

## Origin validation

[`utils/auth/cookie.util.ts`](../../bar-ops-api-v3/packages/shared/utils/auth/cookie.util.ts)
holds `isAllowedOrigin()` — an app-level allowlist (`https://kicks.ltd`,
`https://www.kicks.ltd`, `http://localhost:5173`, `http://localhost:3000`,
`*.kick-55w.pages.dev`) used by the auth handlers, plus the refresh-cookie builders
(`HttpOnly; Secure; SameSite=Lax; Path=/auth`, 30 days to match the Cognito refresh
token).

> This allowlist is **not** CORS. Browser preflights are answered by API Gateway using
> the console CORS config, which does not include localhost on the production API —
> that is why local dev must point at the dev stage.
