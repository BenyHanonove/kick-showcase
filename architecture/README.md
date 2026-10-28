# KICK 🍸 — Architecture Guide

This folder is the map of how this system is built, so a new feature is a **copy of an
existing path**, not a design exercise. Every document here describes what the code
*actually does today* (verified against the source on 2026-09-04), not an aspiration.

| I want to… | Read |
| --- | --- |
| Start a chat with any AI agent on this repo | [AI-WORKFLOW.md](AI-WORKFLOW.md) — how agents are used here, and the prompt each one starts with |
| Add a new API resource (table + endpoints) | [backend/README.md](backend/README.md) → *Golden path* |
| Add a new screen / module in the dashboard | [frontend/README.md](frontend/README.md) → *Golden path* |
| Understand one layer in depth | The numbered files inside [backend/](backend/) and [frontend/](frontend/) |

---

## 1. The system in one picture

```mermaid
graph TD
    subgraph Browser
        SPA[Vue 3 SPA<br/>Vuetify + Pinia]
    end

    subgraph Edge
        CF[Cloudflare Pages<br/>kicks.ltd]
    end

    subgraph AWS[AWS eu-west-1]
        HTTP[HTTP API Gateway<br/>api.kicks.ltd - JWT authorizer]
        WS[WebSocket API]
        L[Lambda handlers<br/>one function per action]
        COG[(Cognito<br/>groups = roles)]
        DDB[(DynamoDB<br/>BarOps-* tables)]
        REDIS[(Redis<br/>versioned cache)]
        PIPE[EventBridge Pipes]
        BUS[Project event bus]
        OBS[Observer lambdas]
        S3[(S3 assets)]
    end

    SPA -->|static| CF
    SPA -->|REST + Bearer access token| HTTP
    SPA -->|live updates| WS
    SPA -->|login / refresh| COG
    HTTP --> L
    L --> DDB
    L --> REDIS
    L --> S3
    DDB -->|streams| PIPE --> BUS --> OBS
    OBS --> DDB
    OBS --> WS
```

## 2. Repo layout

| Path | What lives there |
| --- | --- |
| [`bar-ops-api-v3/`](../bar-ops-api-v3/) | Serverless backend — SST v4 + Pulumi, TypeScript Lambdas |
| [`bar-ops-api-v3/packages/functions/`](../bar-ops-api-v3/packages/functions/) | One folder per resource, one folder per action, one `index.ts` = one Lambda |
| [`bar-ops-api-v3/packages/shared/`](../bar-ops-api-v3/packages/shared/) | DTOs, data-access helpers, guards, utils — everything reusable |
| [`bar-ops-api-v3/packages/testing/`](../bar-ops-api-v3/packages/testing/) | Black-box API tests + the deploy pipeline |
| [`bar-ops-api-v3/infrastructure/`](../bar-ops-api-v3/infrastructure/) | One `*.infrastructure.ts` per resource — Lambda definitions + IAM |
| [`bar-ops-dashboard/`](../bar-ops-dashboard/) | Vue 3 SPA (Vite, Vuetify 3, Pinia), Hebrew/RTL |
| [`bar-ops-dashboard/src/modules/`](../bar-ops-dashboard/src/modules/) | One folder per domain, each a full vertical slice |
| [`bar-ops-dashboard/src/config/`](../bar-ops-dashboard/src/config/) | Router, Pinia root, theme, env |
| [`bar-ops-dashboard/functions/`](../bar-ops-dashboard/functions/) | Cloudflare Pages edge middleware (per-route link previews) |

**Naming:** the user-facing brand is **KICK 🍸**. Internal resources keep the
historical `BarOps-*` prefix (tables, app name, protocol names) — never rename them.

## 3. Global request lifecycle (standardized across all modules)

Every write request across all 19 domain modules flows through this exact pipeline — with uniform guards, validation, optimistic locking, cache invalidation, and error handling at every boundary:

```mermaid
flowchart LR
  subgraph FE["1. Frontend (Vue 3)"]
    direction TB
    V["EntityView.vue"] --> C["useCrud()"] --> P["BaseProvider"] --> R["BaseRepository<br/>+ api.ts"]
  end

  subgraph BE["2. Backend (Lambda)"]
    direction TB
    GW["API Gateway<br/>JWT Auth"] --> G["RolesGuard"] --> DTO["validateBody<br/>(DTO)"] --> DB["DB Helper<br/>(OCC write)"]
  end

  subgraph DATA["3. State & Fan-out"]
    direction TB
    REDIS[("Redis Cache<br/>INCR version")]
    CDC["DynamoDB Stream<br/>Pipe -> Bus -> WS"]
    ERR["401 / 403 / 400<br/>409 Conflict"]
  end

  R -- "HTTPS + JWT" --> GW
  DB -- "200 / 201 OK" --> REDIS
  DB -. "Async CDC" .-> CDC
  GW & G & DTO & DB -. "Reject" .-> ERR
  REDIS -- "Update Store" --> C
  ERR -- "Refetch / Alert" --> C
```

| Step | Layer | Component | Responsibility & Status Handling |
| :---: | :--- | :--- | :--- |
| **1** | **Frontend** | `<Entity>View.vue` | Renders `GenericForm` / table; dispatches user action |
| **2** | **Frontend** | `useCrud<T>()` | Diffs form vs. snapshot, attaches `id` + `timestamp`, updates Pinia store & snackbars |
| **3** | **Frontend** | `BaseProvider<T>` | Wraps calls in `safeCall()` → normalized `{ success, message, data, statusCode }` |
| **4** | **Frontend** | `BaseRepository<T>` + `api.ts` | Sends REST request with in-memory Bearer JWT; on **`401`** silently refreshes token & retries |
| **5** | **Backend** | **HTTP API Gateway** | Validates Cognito JWT signature & expiry (**`401 Unauthorized`** if invalid) |
| **6** | **Backend** | `RolesGuard(allowedRoles)` | Fail-closed RBAC check against Cognito groups (**`403 Forbidden`** if role is too low) |
| **7** | **Backend** | `validateBody(Dto)` | `class-validator` schema & type check (**`400 Bad Request`** on invalid payload) |
| **8** | **Backend** | `create / update / delete` | DynamoDB conditional write on `timestamp` (**`409 Conflict`** on `ConcurrencyConflictError` → client auto-refetches) |
| **9** | **Cache** | **Versioned Redis** | On **`200 / 201`**, runs `INCR version:BarOps-<Table>` and primes the updated item |
| **10** | **Async CDC** | **Stream → Pipe → Bus** | Triggers 18 observer Lambdas (cascades/sync) + broadcasts `{ store, action, id }` over WebSocket |

## 4. The invariants that make new features fast

These are the rules the whole codebase already follows. Break one and you lose the
copy-paste path.

1. **One Lambda = one action.** `packages/functions/<resource>/<action>/index.ts`.
   No routers, no switch statements inside a function.
2. **DTOs are the single source of truth.** The frontend `I*` interfaces mirror the
   backend DTOs field for field — see [Interface–DTO alignment](frontend/03-types.md).
3. **Every update is optimistic-concurrency checked** by `timestamp`. `IUpdate*` /
   `Update*Dto` always carry `timestamp`, and a 409 means "reload and retry".
4. **Authorization is declarative** — `RolesGuard([UserRole.ADMIN])` on the backend,
   `meta.minRole` + `isAdmin` computed on the frontend. Never inline role strings.
5. **Reads go through the cache helpers**, which are invalidated by bumping
   `version:<table>` in Redis. Never call `docClient` directly from a handler.
6. **The frontend never talks to axios directly** — always
   view → composable → provider → repository → `api.ts`.
7. **User-facing strings are Hebrew** and come from `ResourceMessages` (backend) or
   the composable/view (frontend).

## 5. Infrastructure as code & tenancy

- **IaC (`bar-ops-api-v3/infrastructure/`):** DynamoDB tables, the HTTP and WebSocket API Gateways, the EventBridge bus, Cognito pools, DLQs, X-Ray tracing, and CloudWatch alarms are declared in SST/Pulumi with `import` support for adopting the existing console-created production resources. See [infrastructure-as-code.md](infrastructure-as-code.md) for the stage model and one-time import procedure.
- **Tenancy:** Each deployment is single-tenant by design (clients are rows in `BarOps-Client`, not tenants). See [multi-tenancy.md](multi-tenancy.md) for the silo vs. pooled multi-tenant design notes.

## 6. Health snapshot

CI is the source of truth: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
runs on every push and pull request.

| Job | Steps |
| --- | --- |
| `dashboard` | `npm ci` → `npm run type-check` (vue-tsc) → `npm run lint` → `npm test` (Vitest) |
| `api` | `npm ci --ignore-scripts` → `npm run typecheck` (tsc, Lambda code only) → `npm test` (Vitest) |

The black-box API suites in [`packages/testing/`](../bar-ops-api-v3/packages/testing/)
need a deployed stage and Cognito test users, so they run in the deploy pipeline
(`npm run deploy:barops`: deploy dev → clean → test as each role → deploy production),
not in public CI. Known operational notes: `quotation.js` is skipped in the API test
suite (model not in use), and `/employee/notify` has no API Gateway route yet.
