# Infrastructure as code: adopting the console-created resources

> **Status: written and type-checked, NOT yet run against production.**
> No `sst deploy` has been executed with this code. The first production deploy
> is a one-time import that must follow the procedure below.

## Why

KICK started with ClickOps: the DynamoDB tables, the HTTP API (routes, JWT
authorizer, CORS, throttling), the WebSocket API, the event bus, the broadcaster's
stream triggers and the Cognito user pool were created by hand in the AWS console,
and the SST program only referenced them by hard-coded ids. Consequences:

- a new environment (a PR preview, a second AWS account) could not be created with
  one `sst deploy`; the 2026 account migration needed manual scripts;
- nothing guaranteed that every route had the JWT authorizer;
- dev and production shared one Cognito pool, so a dev token was valid in production.

Now every one of those resources is declared in `bar-ops-api-v3/infrastructure/`:

| Resource | Declared in | Import id |
| --- | --- | --- |
| 19 DynamoDB tables (keys, GSIs, streams, TTL) | `_tables.infrastructure.ts` | table name |
| Project event bus | `_shared.infrastructure.ts` | bus name |
| HTTP API, stage, JWT authorizer | `_http-api.infrastructure.ts` | `HTTP_API_ID`, `<apiId>/<stage>`, `<apiId>/<authorizerId>` |
| HTTP routes + Lambda integrations (route table `ROUTES`) | `_http-api.infrastructure.ts` | `<apiId>/<routeId>`, `<apiId>/<integrationId>` |
| WebSocket API, stage, `$connect`/`$disconnect`/`$default` | `websocket.infrastructure.ts` | `WEBSOCKET_API_ID`, … |
| Broadcaster DynamoDB-stream event source mappings | `websocket.infrastructure.ts` | mapping UUID |

## How stages behave

The mechanism is Pulumi's `import` resource option, driven by config
(`_config.infrastructure.ts`):

- **`IMPORT_EXISTING=false` (default): create.** Any new stage (`pr-42`, a fresh
  account) gets brand-new tables, APIs, bus and (see below) its own Cognito pool.
  Stage-owned names are prefixed with the stage: `pr-42-BarOps-Shift`.
- **`IMPORT_EXISTING=true`: adopt.** Each declared resource is given
  `opts.import = <existing id>`, so the deploy takes ownership of the console
  resource instead of creating a duplicate. Production keeps its historical,
  unprefixed names (`BarOps-Shift`) and `dev` keeps `dev-BarOps-*`, so both existing
  stages can be adopted the same way.

Production is protected three ways: the app sets `protect: true` and
`removal: "retain"` for the `production` stage (`sst.config.ts`), and every
adopted resource additionally gets `retainOnDelete: true`, so even removing a
resource from the code only drops it from state and never deletes the table.

Pulumi refuses an import whose declared inputs differ from the real resource.
That is the safety net: a wrong key schema or GSI fails the deploy instead of
replacing a table. Where the console holds settings the code does not own
(API/stage names and descriptions, throttling, access logs, integration
timeouts), the adopting resources use `ignoreChanges`, so the existing values are
kept.

## Cognito: one pool per non-production stage

`_cognito.infrastructure.ts` decides which pool is active:

- `COGNITO_USER_POOL_ID` + `COGNITO_CLIENT_ID` set: that existing pool is used as is.
  **Required in production** (the deploy throws without it). The production pool is
  referenced, not imported: its triggers, groups and app client stay as configured
  in the console.
- Unset (dev, PR stages): the stage creates `sst.aws.CognitoUserPool` with the e-mail
  OTP triggers (`auth/message`, `define`, `create`, `verify`, `post-confirmation`),
  an app client allowing `ADMIN_USER_PASSWORD_AUTH`, `CUSTOM_AUTH` and
  `REFRESH_TOKEN_AUTH` (no hosted UI), and the groups `Admin`, `Manager`, `Users`
  (the names `RolesGuard` checks, `packages/shared/guards/user-role.enum.ts`).

The HTTP API's JWT authorizer (issuer + audience), the auth Lambdas and the
WebSocket `$connect` function are all wired to the active pool, so a dev token is
rejected by production and vice versa. To keep `dev` on the old shared pool during a
transition, set the two variables in `.env.dev`.

## One-time production import procedure

1. **Collect the ids (read-only AWS calls).**

   ```bash
   aws apigatewayv2 get-apis                       # HTTP + WebSocket API ids
   aws apigatewayv2 get-authorizers --api-id <HTTP_API_ID>
   aws apigatewayv2 get-routes       --api-id <HTTP_API_ID>
   aws apigatewayv2 get-integrations --api-id <HTTP_API_ID>
   aws apigatewayv2 get-routes       --api-id <WEBSOCKET_API_ID>
   aws apigatewayv2 get-integrations --api-id <WEBSOCKET_API_ID>
   aws lambda list-event-source-mappings \
     --function-name bar-ops-api-v3-production-sockets-broadcaster
   for t in $(aws dynamodb list-tables --query 'TableNames[?starts_with(@, `BarOps-`)]' --output text); do
     aws dynamodb describe-table --table-name "$t"
     aws dynamodb describe-time-to-live --table-name "$t"
   done
   ```

2. **Compare the tables with `TABLE_DEFINITIONS`.** Key schema, attribute types,
   GSI names/keys/projection, `StreamSpecification` and TTL must match exactly.
   The definitions were derived from the code (`Key: {...}`, `IndexName` +
   `KeyConditionExpression`), but which tables have a stream and which have TTL
   enabled could not be read from code for every table. Fix the definition, not the
   table.

3. **Write `.env.production`** (never committed):

   ```bash
   IMPORT_EXISTING=true
   HTTP_API_ID=...
   HTTP_API_AUTHORIZER_ID=...
   HTTP_API_STAGE_NAME='$default'          # whatever the console stage is called
   WEBSOCKET_API_ID=...
   WEBSOCKET_STAGE_NAME=production
   CORS_ALLOW_ORIGINS=https://...,https://...   # must equal the console CORS config
   IMPORT_IDS_FILE=.env.production.import-ids.json
   ```

   and `.env.production.import-ids.json` (matched by the `.env.*` gitignore rule, so it
   stays local). Keys are route keys and base table names:

   ```json
   {
     "httpRoutes":       { "GET /client/{id}": "<routeId>", "...": "..." },
     "httpIntegrations": { "GET /client/{id}": "<integrationId>" },
     "wsRoutes":         { "$connect": "<routeId>", "$disconnect": "...", "$default": "..." },
     "wsIntegrations":   { "$connect": "<integrationId>" },
     "broadcasterMappings": { "BarOps-Session": "<uuid>", "BarOps-Sale": "<uuid>" }
   }
   ```

   `ROUTES` in `_http-api.infrastructure.ts` was reconstructed from the handlers and
   the dashboard; any console route missing from it stays unmanaged, and any route in
   it that has no import id is created (API Gateway rejects a duplicate route key, so
   a mismatch fails loudly). If the routes are not ready to be adopted, set
   `MANAGE_API_ROUTES=false`: only the Lambda invoke permissions are deployed and the
   console keeps owning routes, exactly as before.

4. **Preview, then deploy.**

   ```bash
   npx sst diff   --stage production    # expect "import" for every adopted resource, no "replace"
   npx sst deploy --stage production
   ```

   Any `replace` or "inputs to import do not match" in the diff means a definition is
   wrong: fix it and diff again. Never pass `--target` tricks or delete the table to
   make the diff go away.

5. **After the first successful deploy** the resources are in state. The `import`
   option is then a no-op; `IMPORT_EXISTING` can stay `true`. Optionally enable
   `deletionProtectionEnabled` and point-in-time recovery on the production tables in
   a follow-up change (they were left out so the import matches the current tables).

`dev` can be adopted with the same procedure (`.env.dev` with its own ids), or
deleted and recreated from scratch by deploying with `IMPORT_EXISTING=false`.

## Known gaps

- `sockets/broadcaster` derives the dashboard store from the table name by stripping
  a `dev-` prefix; on other non-production stages (`pr-42-BarOps-Sale`) the store name
  will not match until the code strips any `<stage>-` prefix.
- The S3 global bucket, the SES identity and Redis are still shared, pre-existing
  resources passed in by config (`GLOBAL_BUCKET`, `SES_FROM_ADDRESS`, `REDIS_*`).

## Configuration reference (`.env.<stage>`)

| Variable | Required | Meaning |
| --- | --- | --- |
| `REDIS_HOST`, `REDIS_PORT` | yes | Redis endpoint; the password is in SSM `/bar-ops-api-v3/<stage>/redis-password` |
| `GLOBAL_BUCKET`, `SES_FROM_ADDRESS` | yes | Shared assets bucket, verified SES sender |
| `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` | production | Existing pool + app client; unset elsewhere = stage-owned pool |
| `IMPORT_EXISTING` | no (`false`) | `true` adopts console-created resources instead of creating them |
| `HTTP_API_ID`, `HTTP_API_AUTHORIZER_ID` | with `IMPORT_EXISTING` | HTTP API and its JWT authorizer to adopt |
| `HTTP_API_STAGE_NAME` | no (`$default`) | HTTP API stage name |
| `WEBSOCKET_API_ID` | with `IMPORT_EXISTING` | WebSocket API to adopt |
| `WEBSOCKET_STAGE_NAME` | no (stage name) | WebSocket stage (`production`, `dev`) |
| `IMPORT_IDS_FILE` | no | JSON with route/integration/event-source-mapping ids to adopt |
| `MANAGE_API_ROUTES` | no (`true`) | `false` leaves routes/integrations in the console (permissions only) |
| `CORS_ALLOW_ORIGINS` | no | Comma-separated dashboard origins for the HTTP API CORS config |
| `WHATSAPP_PHONE_NUMBER_ID` | no | Meta sender id; the token itself lives in SSM `/kick/<stage>/whatsapp-token` |
| `ALARM_EMAIL` | no | Subscribes an e-mail to the stage alarm SNS topic |
| `ALARMS_ENABLED` | no (production only) | Lambda error/throttle and API 5xx/p95 alarms |
| `POWERTOOLS_LOG_LEVEL` | no (`INFO` prod, `DEBUG` else) | Log level passed to every function |

## Reliability and observability wired by the IaC

- **Dead-letter queues.** Every bus subscriber (`subscribeToBus`) has an SQS DLQ used
  twice: as the EventBridge target DLQ (delivery retried for up to 1 hour) and as the
  Lambda on-failure destination (2 async retries). Each stream pipe has a DLQ with 10
  retries / 24 h max record age. The broadcaster's stream mappings retry 3 times,
  bisect failing batches and then send the record metadata to its DLQ. Each DLQ has a
  CloudWatch alarm on `ApproximateNumberOfMessagesVisible > 0`.
- **Tracing and logs.** All functions run with active X-Ray tracing and get
  `POWERTOOLS_SERVICE_NAME` (the domain module, e.g. `shift`) and
  `POWERTOOLS_LOG_LEVEL`.
- **Alarms** (SNS topic `<app>-<stage>-alarms`): Lambda errors per module, account-wide
  Lambda throttles (the 40-concurrency account limit is shared by all stages), HTTP API
  5xx (>= 5 in 5 min) and p95 latency (> 3 s for 15 min).

## Manual steps still required in production

1. Run the import procedure above (`sst diff`, then `sst deploy --stage production`).
2. Create the WhatsApp token parameter before re-enabling the service:
   `aws ssm put-parameter --name /kick/production/whatsapp-token --type SecureString --value ...`
   (same for each stage that sends WhatsApp messages).
3. Set `ALARM_EMAIL` and confirm the SNS subscription e-mail after the first deploy.
