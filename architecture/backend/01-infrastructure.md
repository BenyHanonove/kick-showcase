# Layer 1 — Infrastructure & stages

**Files:** [`sst.config.ts`](../../bar-ops-api-v3/sst.config.ts) ·
[`infrastructure/_shared.infrastructure.ts`](../../bar-ops-api-v3/infrastructure/_shared.infrastructure.ts) ·
one `infrastructure/<resource>.infrastructure.ts` per resource

## What this layer owns

Turning `packages/functions/**/index.ts` files into deployed Lambdas with exactly the
IAM they need, wiring DynamoDB streams to the event bus, and nothing else.

## Stages

| Stage | Purpose | Env file | HTTP API | Table prefix |
| --- | --- | --- | --- | --- |
| `dev` | integration testing, local frontend | `.env.dev` | `<HTTP_API_ID>` (dev) | `dev-BarOps-*` |
| `production` | live | `.env.production` | `<HTTP_API_ID>` (prod, `api.kicks.ltd`) | `BarOps-*` |

`production` is `protect`ed and set to `retain` on removal. A non-production stage
without its own `.env.<stage>` **throws at deploy time** rather than silently falling
back to production values.

## The `$transform` block — free behaviour every Lambda gets

Defined once in `sst.config.ts`; you never repeat it per function:

- Runtime `nodejs24.x`, memory `128 MB` (override per function when needed).
- `REDIS_HOST` / `REDIS_PORT` injected from the stage env file; the password is read at
  cold start from SSM `/bar-ops-api-v3/<stage>/redis-password`, and `ssm:GetParameter`
  on that exact parameter is appended to every function's policy.
- Missing `REDIS_HOST`/`REDIS_PORT` aborts the deploy loudly.
- **Function naming is derived from the handler path**:
  `packages/functions/<service>/<action>/index.handler` →
  `bar-ops-api-v3-<stage>-<service>-<action>`. Keep the folder layout and the names
  stay predictable (this is what the console route wiring points at).
- If an action folder contains `events.json`, its entries are registered as shareable
  **Lambda test events** in EventBridge Schemas — that is why you can hit "Test" in the
  console with a real payload already filled in.

## Helpers in `_shared.infrastructure.ts`

| Helper | Use |
| --- | --- |
| `stageResourceName(name)` | `BarOps-X` in production, `dev-BarOps-X` elsewhere |
| `dynamoTable(name)` | References an **existing** table; returns `{name, arn, indexArn, streamArn, table}` |
| `apiPermission(name, fn)` | Grants API Gateway permission to invoke the function |
| `createStreamPipe(name, table)` | DynamoDB stream → EventBridge Pipe → project bus, with its IAM role (includes a 15s IAM-propagation wait) |
| `subscribeToBus(...)` | Subscribes an observer Lambda to bus events |
| `lambdaName(service, action)` | Same naming rule as the transform, for cross-references |

Constants that are hardcoded on purpose (all console-created): `COGNITO_USER_POOL_ID`,
`COGNITO_CLIENT_ID`, `HTTP_API_ID`, `WEBSOCKET_ENDPOINT`.

## IAM: least privilege per action

The pattern to copy — each function gets only its verb:

| Action | DynamoDB permissions |
| --- | --- |
| create | `PutItem` |
| get | `GetItem` |
| list | `Query`, `Scan` on `table.arn` **and** `table.indexArn` |
| update | `GetItem`, `PutItem`, `UpdateItem` |
| delete | `DeleteItem` (add `Query` + `BatchWriteItem` on the child table for cascades) |

## Gotchas

- **Adding an infrastructure file does nothing until you `await import` it** in
  `sst.config.ts`.
- **Deploy does not create routes.** New endpoints are invisible until wired in the API
  Gateway console for that stage.
- The production bootstrap bucket gets a 7-day asset lifecycle rule — production-only
  branch at the bottom of `run()`.
