# Layer 8 — Testing & deployment

**Files:** [`packages/testing/`](../../bar-ops-api-v3/packages/testing/)

Tests are **black-box HTTP tests against a deployed stage**, run as three different
Cognito users. There are no unit tests or mocks on the backend — the contract that
matters is "what does the deployed endpoint return for this role".

## Layout

| Folder | Contents |
| --- | --- |
| `endpoints/<resource>/*.js` | thin axios wrappers, one per action (`createClient(payload)`) |
| `lifecycles/<resource>.js` | the role matrix + full CRUD cycle for that resource |
| `observer/` | stream side-effect suites (admin only) |
| `shared/` | `api.js`, `config.js`, `auth-guard.js`, `select-role.js`, `role-assert.js`, `role-matrix.js` |
| `pipeline/` | `run-tests.js`, `deploy.js` |
| `logs/<timestamp>/` | per-run output |

`shared/config.js` maps `STAGE` → gateway URL (`dev` → `pit93c7c4h`,
`production` → `dn3xyet6gl`) and requires `VITE_COGNITO_CLIENT_ID` plus the six
`TEST_{ADMIN,MANAGER,USER}_{EMAIL,PASSWORD}` variables from the stage env file.

## A lifecycle test

Copy [`lifecycles/client.js`](../../bar-ops-api-v3/packages/testing/lifecycles/client.js).
Its shape:

```js
async function runUserChecks()    { await assertForbidden(() => createClient(P), 'client create as user'); … }
async function runManagerChecks() { /* 403 on writes, 200 on reads; fixture via asAdmin() */ }
async function runAdminChecks()   { /* create → get → list → update → delete */ }
```

- `assertForbidden` asserts a 403 — permissions are tested as first-class behaviour.
- `asAdmin(fn)` borrows an admin session to build a fixture inside a non-admin run.
- Always clean up in `finally`; the suites run against a shared dev stage.

## Running

```bash
npm run test:dev        # every lifecycle × admin/manager/user, concurrency 5
npm run deploy:barops   # the pipeline below
```

`run-tests.js` caps concurrency at 5 (parallel logins trip Cognito's `InitiateAuth`
throttle), runs observer suites only as admin, forces `shift-registration.js`,
`shift.js` and `employee-token.js` to run **exclusively** (they share the single
allow-listed WhatsApp test number), and skips `quotation.js`.

## The deploy pipeline

[`pipeline/deploy.js`](../../bar-ops-api-v3/packages/testing/pipeline/deploy.js) is the
only sanctioned road to production:

```
1. sst deploy --stage dev
2. run every test on dev, as all three roles   ← abort here and production is untouched
3. sst deploy --stage production
```

Escape hatches when you know what you are doing: `npm run deploy` (dev),
`npm run deploy:prod`, `npm run dev` (`sst dev` live Lambda).

## After deploying a new resource

Deploy does not create API Gateway routes. Wire them in the console for the stage, then
re-run the tests — a route you forgot shows up as a 404 in the lifecycle test, which is
exactly what it is for.
