# Tenancy: what the system is today, and how it would become multi-tenant

## Today: single-tenant

KICK is built for **one operating company per deployment**. Its own customers (the
people and companies that book an event bar) are rows in `BarOps-Client`. They are
data, not tenants. They never log in.

What the code shows:

| Layer | What is there | Where |
| --- | --- | --- |
| DynamoDB keys | Every table is keyed by `id` alone. `get` / `update` / `delete` all use `Key: { id }` | [`packages/shared/aws/dynamo/`](../bar-ops-api-v3/packages/shared/aws/dynamo/) |
| GSIs | `SessionIdIndex`, `ClientIdIndex`, `MonthYearIndex`, `EmployeeIdIndex`, `ShiftIdIndex`, `IdentityNumberIndex`, `PhoneIndex`. None is scoped by tenant | handlers under [`packages/functions/`](../bar-ops-api-v3/packages/functions/) |
| Identity | Cognito groups `Admin` / `Manager` / `Users` are the only authorization input. No tenant attribute or custom claim. Self sign-up lands in `Users`, which no endpoint accepts | [`role.guard.ts`](../bar-ops-api-v3/packages/shared/guards/role.guard.ts), [`auth/post-confirmation`](../bar-ops-api-v3/packages/functions/auth/post-confirmation/index.ts) |
| Cache | Redis keys are `version:<table>` and `get:<table>:<version>:<id>` | [`update.dynamo.ts`](../bar-ops-api-v3/packages/shared/aws/dynamo/update.dynamo.ts), [`client.redis.ts`](../bar-ops-api-v3/packages/shared/aws/redis/client.redis.ts) |
| Real-time | The connection row stores `connectionId`, `userId`, `roomId`. The broadcaster scans all connections and filters only by room (`sessionId`) | [`sockets/broadcaster`](../bar-ops-api-v3/packages/functions/sockets/broadcaster/index.ts) |
| Files | One bucket with fixed prefixes (`documents/`, `expenses/`, `receipts/`, `z-reports/`, `pdf/`) | `*.infrastructure.ts` |
| Isolation that does exist | Stages: `production` and `dev` use separate tables (`dev-` prefix via `stageResourceName`) and separate API Gateways | [`_shared.infrastructure.ts`](../bar-ops-api-v3/infrastructure/_shared.infrastructure.ts) |

**Consequence:** two companies cannot share one deployment. Any `Manager` would see the
other company's employees, shifts and cashiers. A second company needs a second
deployment (a silo), and today `stageResourceName` only knows two variants
(`production` and `dev-`), so that would also need a small change to the naming
helpers.

## Option A: silo (one deployment per tenant)

Cheapest path, and the one I would take for the first few tenants.

1. Generalize `stageResourceName` to `<tenant>-<stage>-<BarOps-Table>` and give each
   tenant its own SST stage (or AWS account under an Organization).
2. One Cognito user pool per tenant. The dashboard picks its API and pool from the
   hostname (for example `acme.kicks.ltd`), so the SPA build stays shared.
3. Cost: per-tenant fixed overhead is close to zero (on-demand tables, Lambdas, Pipes
   are all pay-per-use). Ops cost is N deploys per release, which the existing
   `deploy.js` pipeline can loop over.

Trade-off: no cross-tenant reporting, and N copies of every resource to migrate when
the schema changes.

## Option B: pool (shared tables, tenant in the key)

The right design once there are many small tenants.

1. **Identity.** Add a `tenantId` to every user. A Cognito *Pre Token Generation*
   trigger copies it into the access token as a claim. The JWT authorizer already
   verifies the token, so the claim is trusted.
2. **Guard.** Extend `RolesGuard` into `TenantGuard(roles, handler)`: read `tenantId`
   from the claims, deny when it is missing (fail closed, as `RolesGuard` does for
   roles), and put it in the existing `AsyncLocalStorage` context next to `editorId`.
3. **Data access.** The shared helpers (`create`, `get`, `list`, `update`, `delete`)
   read `tenantId` from that context, never from the request body:
   - partition keys become `tenantId#id`; GSI partition keys become
     `tenantId#sessionId`, `tenantId#monthYear`, and so on;
   - every write adds `tenantId` and every conditional write also checks it.
   Handlers do not change, because they never call `docClient` directly
   (architecture invariant 5).
4. **Defense in depth.** IAM `dynamodb:LeadingKeys` can enforce the prefix, but only
   with per-request credentials (STS `AssumeRole` with a `tenantId` session tag). That
   adds latency and complexity; I would start with the helper-level enforcement plus
   tests that call every endpoint with a token from tenant B against tenant A's ids.
5. **Cache.** Prefix Redis keys with the tenant: `version:<tenant>:<table>`. This also
   makes invalidation finer: one tenant's writes stop evicting everyone's cache.
6. **Real-time.** `$connect` already verifies the JWT; store `tenantId` on the
   connection row. The broadcaster filters by `tenantId` before `roomId`, and moves
   from `Scan` to a `Query` on a `tenantId` GSI.
7. **Files.** S3 keys under `<tenantId>/...`, with the presign handlers deriving the
   prefix from the context.
8. **Migration.** Backfill `tenantId` on every row (one tenant, so one value), write
   new keys alongside the old ones, switch reads, then drop the old keys. Streams
   and observers keep working because they key off `eventSourceARN` and `id`.

Trade-off: one bug in the shared helpers leaks across tenants, so the cross-tenant
test suite becomes a deploy gate like the existing role matrix.
