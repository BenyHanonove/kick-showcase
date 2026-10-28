# KICK 🍸 — Real-time serverless operations platform for bars & event venues

[![CI](https://github.com/BenyHanonove/kick-showcase/actions/workflows/ci.yml/badge.svg)](https://github.com/BenyHanonove/kick-showcase/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AWS Serverless](https://img.shields.io/badge/AWS-Lambda%20%C2%B7%20DynamoDB%20%C2%B7%20EventBridge-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![SST v4](https://img.shields.io/badge/IaC-SST%20v4%20%2F%20Pulumi-E27152)](https://sst.dev/)
[![Vue 3](https://img.shields.io/badge/Vue%203-Pinia%20%C2%B7%20Vuetify%20%C2%B7%20RTL-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)

> Production operations system used by **2 paying venues** to run service nights end-to-end: shifts & clock-ins, cash registers & automated tip splitting, live inventory & consumption audits, staff task boards ("missions"), expense tracking, and closing PDF reports.
> Hebrew / RTL interface. Designed, built, deployed, and operated solo (2026).

<div align="center">
  <img src="docs/demo.gif" alt="KICK real-time dashboard demo — two sessions syncing shifts, registers, and tips live over WebSockets" width="100%" />
  <p><sub>Live demo recorded against the deterministic fixture harness (<a href="docs/demo.mp4">MP4 video</a> · reproduce locally with <code>npm run demo</code>)</sub></p>
</div>

---

## Highlights

- **Event-driven Change Data Capture (CDC)** — DynamoDB Streams feed 9 **EventBridge Pipes** into a central event bus; 18 observer Lambdas handle cascading deletes, cross-entity status sync, and side effects outside the request path, backed by per-subscriber SQS dead-letter queues and CloudWatch alarms.
- **Zero-account staff management via WhatsApp bot & ephemeral single-use tokens** — Field staff (bartenders, waiters, runners) never create user accounts or passwords. An automated WhatsApp Cloud API bot dispatches short-lived, cryptographically random single-use tokens (`TOKEN_TTL_HOURS = 24`, DynamoDB TTL) pointing to isolated public routes (`/shift/resolve`, `/shift/register`, `/employee/claim`) for onboarding, shift self-registration, and arrival/schedule notifications — consumed atomically via `TransactWriteCommand` so a link can never be replayed or double-spent.
- **Real-time fan-out without data leaks** — WebSocket broadcasts push only `{ action, id }` invalidation signals scoped to the active session room; clients refetch through role-guarded REST endpoints so authorization and field-level redaction stay in one place.
- **Concurrency & idempotency** — Optimistic locking (`timestamp` condition on every `UpdateCommand`, returning `409 Conflict` with automatic client diff/refetch), deterministic composite IDs (`deterministicId('shift-registration', sessionId, employeeId)`) preventing duplicate shift creation across concurrent tabs, and race-free versioned Redis caching (`version:<table>`).
- **Defense-in-depth security** — Short-lived access JWT kept in memory only + `HttpOnly; Secure; SameSite=None` refresh cookie, Cognito JWT verification on both HTTP API Gateway and WebSocket `$connect`, fail-closed `RolesGuard([Admin, Manager, Users])`, field-level financial redaction for non-admin roles, per-Lambda least-privilege IAM, and PII-redacting structured logs (AWS Lambda Powertools + X-Ray active tracing).
- **Verified across roles** — 307 frontend unit tests and 108 backend unit tests run on every push in GitHub Actions; black-box lifecycle suites execute against the `dev` stage as `Admin`, `Manager`, and `User` before any production deployment (`pipeline/deploy.js`).

---

## Architecture

```mermaid
flowchart LR
  subgraph Client["Browser"]
    SPA["Vue 3 SPA<br/>Pinia · Vuetify · RTL<br/>access token in memory"]
  end
  subgraph Edge["Cloudflare"]
    PAGES["Pages + edge middleware"]
    PROXY["Worker: api / ws proxy"]
  end
  subgraph AWS["AWS · eu-west-1"]
    HTTP["HTTP API<br/>Cognito JWT authorizer"]
    WSAPI["WebSocket API"]
    AUTH["Auth & Trigger Lambdas<br/>login · refresh · OTP"]
    L["105 HTTP Lambdas<br/>one per action<br/>RolesGuard · DTO validation"]
    COG[("Cognito<br/>groups = roles")]
    DDB[("DynamoDB<br/>19 tables + GSIs")]
    REDIS[("Redis<br/>versioned read cache")]
    S3[("S3<br/>receipts · PDFs")]
    PIPE["9 EventBridge Pipes<br/>+ SQS DLQs"]
    BUS["Project Event Bus"]
    OBS["18 Observer Lambdas<br/>cascade · sync + DLQs"]
    BC["Broadcaster Lambda<br/>room-scoped fan-out"]
  end
  SPA --> PAGES
  SPA -- "REST + Bearer" --> PROXY --> HTTP
  SPA -- "WSS (token in subprotocol)" --> PROXY --> WSAPI
  HTTP --> AUTH
  AUTH <--> COG
  HTTP --> L
  L --> DDB
  L <--> REDIS
  L --> S3
  DDB -- "Streams" --> PIPE --> BUS --> OBS --> DDB
  DDB -- "Streams" --> BC -- "notify {action, id}" --> WSAPI
  WSAPI -. "client refetches via REST" .-> SPA
```

<details>
<summary><strong>High-resolution diagram & sequence flows (Optimistic Concurrency 409 · Notify-then-Refetch WebSocket · Ephemeral Token Bot Flow)</strong></summary>

<p align="center">
  <img src="docs/architecture.png" alt="KICK Architecture Diagram" width="100%" />
</p>

### Sequence 1: Concurrent edit → `409 Conflict` recovery

```mermaid
sequenceDiagram
  autonumber
  participant A as Manager A (SPA)
  participant B as Manager B (SPA)
  participant API as Update Lambda
  participant DDB as DynamoDB
  participant R as Redis Cache

  Note over A,B: Both load Shift #42 (timestamp = 1700000100)
  A->>API: PUT /shift/42 { timestamp: 1700000100, notes: "Bar A" }
  API->>DDB: UpdateItem (Condition: #ts = 1700000100)
  DDB-->>API: OK (new timestamp = 1700000250)
  API->>R: INCR version:BarOps-Shift & prime key
  API-->>A: 200 OK

  B->>API: PUT /shift/42 { timestamp: 1700000100, notes: "Bar B" }
  API->>DDB: UpdateItem (Condition: #ts = 1700000100)
  DDB-->>API: ConditionalCheckFailedException
  API-->>B: 409 Conflict (ConcurrencyConflictError)
  B->>API: GET /shift/42 (auto-refetch latest state)
  API-->>B: 200 OK (timestamp = 1700000250)
```

### Sequence 2: Write → DynamoDB Stream → WebSocket notify → Role-guarded refetch

```mermaid
sequenceDiagram
  autonumber
  participant A as Bartender (SPA)
  participant B as Manager (SPA)
  participant API as HTTP Lambda
  participant DDB as DynamoDB + Stream
  participant BC as Broadcaster Lambda
  participant WS as WebSocket API

  A->>API: POST /consume (new inventory item)
  API->>DDB: PutItem (BarOps-Consume)
  API-->>A: 201 Created
  DDB->>BC: Stream record (INSERT, Keys.id)
  BC->>WS: PostToConnection (room = sessionId)<br/>{ store: "consume", action: "create", id }
  WS-->>B: Push notification (no entity payload)
  B->>API: GET /consume/{id} (with Manager Bearer JWT)
  API-->>B: 200 OK (role-filtered entity)
```

### Sequence 3: Accountless staff management via WhatsApp bot & single-use public token

```mermaid
sequenceDiagram
  autonumber
  participant M as Manager (SPA)
  participant OPEN as ShiftOpen / Notify Lambda
  participant DDB as DynamoDB (Token + Shift)
  participant WA as WhatsApp Cloud API Bot
  participant E as Employee (Mobile Browser)
  participant REG as Public Register Lambda

  M->>OPEN: POST /shift/open/{sessionId} { employeeId }
  OPEN->>DDB: PutItem BarOps-ShiftToken (token, expiresAt = +24h, used = false,<br/>snapshotted event name/datetime/location)
  OPEN->>WA: Send template "shift_availability_request" with button URL ?token=...
  WA-->>E: WhatsApp message with one-tap registration link
  E->>REG: POST /shift/resolve { token } (unauthenticated public route)
  REG->>DDB: GetItem BarOps-ShiftToken (ConsistentRead)
  REG-->>E: 200 OK (snapshotted display fields only — no DB fan-out)
  E->>REG: POST /shift/register { token, role, notes }
  REG->>DDB: TransactWrite: [Delete token IF used=false & expiresAt>now,<br/>Put Shift(deterministicId) IF attribute_not_exists(id)]
  DDB-->>REG: Committed atomically (token burned, shift created)
  REG-->>E: 201 Created { id, role }
  Note over M,WA: Once manager sets exact arrival hour, POST /shift/notify dispatches<br/>personalized arrival-time reminders to all staffed workers via WhatsApp
```

</details>

### Global Request Lifecycle (Standardized Across All 19 Modules)

Every domain module follows the same end-to-end pipeline from the Vue view down to DynamoDB, Redis, and EventBridge:

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

---

## Interface Screenshots

| Events List (Light) | Events List (Dark) |
| :---: | :---: |
| ![Events List](docs/screenshots/events-list.png) | ![Events List Dark](docs/screenshots/events-list-dark.png) |
| **Event Summary & Closing** | **Shift Manager & Clock-ins** |
| ![Event Summary](docs/screenshots/event-summary.png) | ![Shift Manager](docs/screenshots/shift-manager.png) |
| **Tip Pool & Splits (Light)** | **Tip Pool & Splits (Dark)** |
| ![Tips](docs/screenshots/tips.png) | ![Tips Dark](docs/screenshots/tips-dark.png) |

---

## Engineering Decisions & Trade-offs

| Decision | Why | Cost / Trade-off |
| --- | --- | --- |
| **Ephemeral single-use tokens over employee accounts** | Event staff rotate constantly across outdoor productions; forcing 100+ casual bartenders to manage Cognito credentials kills adoption. Automated WhatsApp bot links (`/shift/register`, `/employee/claim`) with short TTLs and `TransactWrite` burn-on-use give zero-friction UX and zero persistent attack surface | Requires dedicated token tables (`BarOps-ShiftToken`, `BarOps-EmployeeToken`), snapshotting display metadata onto the token row so public `resolve` routes cannot enumerate core tables, and strict `TransactWrite` conditions against double-submit |
| **DynamoDB over PostgreSQL** | Known access patterns (by `id`, `sessionId`, `monthYear`), native Change Data Capture via Streams, near-zero idle cost on pay-per-request | Ad-hoc cross-table analytics require export or in-memory aggregation; `list()` paginates via `LastEvaluatedKey` |
| **One Lambda per action** | Strict per-function IAM least privilege, isolated cold-start blast radius, independent CloudWatch metrics per endpoint | ~130 functions to manage in IaC (solved with declarative factory helpers in `infrastructure/`) |
| **Notify-then-refetch WebSockets** | WebSocket frame carries only `{ store, action, id }`; authorization and manager field redaction remain in the HTTP handlers | $N$ connected clients in the room issue a `GET /<resource>/:id` (served from the versioned Redis cache after the first read) |
| **Versioned Redis cache keys** | `get:<table>:<version>:<id>` + `INCR version:<table>` gives $O(1)$ invalidation without `SCAN`/`KEYS` or read-modify-write races | Table-level granularity: any write to a table advances the version for all cached items of that table |
| **Single-tenant per deployment** | Simplifies data model and keeps blast radius isolated per venue company; near-zero fixed overhead per serverless stage | Multi-company SaaS requires either per-tenant stages (silo) or composite `tenantId#id` keys (see [`architecture/multi-tenancy.md`](architecture/multi-tenancy.md)) |

---

## Infrastructure as Code & Production Status

All AWS resources — **19 DynamoDB tables** (with GSIs, Streams, and TTL), the **HTTP API Gateway** (routes, integrations, JWT authorizer, CORS), the **WebSocket API**, **Cognito User Pools** (with per-stage isolation for non-production stages), **EventBridge Pipes**, **SQS Dead-Letter Queues**, **X-Ray active tracing**, and **CloudWatch Alarms** — are declared in SST v4 / Pulumi under [`bar-ops-api-v3/infrastructure/`](bar-ops-api-v3/infrastructure/).

- **Fresh stages (`IMPORT_EXISTING=false`):** `npx sst deploy --stage <name>` provisions an isolated stack from scratch, including a dedicated Cognito user pool and `<stage>-BarOps-*` tables.
- **Adopting existing console resources (`IMPORT_EXISTING=true`):** Uses Pulumi's `import` option with `protect: true` and `retainOnDelete: true` so existing production tables and API Gateways are adopted into state without replacement. Full runbook: [`architecture/infrastructure-as-code.md`](architecture/infrastructure-as-code.md).

---

## Repository Layout

| Path | Description |
| --- | --- |
| [`bar-ops-api-v3/infrastructure/`](bar-ops-api-v3/infrastructure/) | SST v4 / Pulumi IaC modules: tables, HTTP & WebSocket APIs, Cognito, Pipes, DLQs, CloudWatch alarms |
| [`bar-ops-api-v3/packages/functions/`](bar-ops-api-v3/packages/functions/) | Lambda handlers (`<resource>/<action>/index.ts`), EventBridge observers, Cognito triggers, WebSocket handlers |
| [`bar-ops-api-v3/packages/shared/`](bar-ops-api-v3/packages/shared/) | Shared core: DynamoDB helpers (`create`/`get`/`list`/`update`/`delete`), versioned Redis client, `RolesGuard`, DTOs (`class-validator`), Powertools logger & tracer |
| [`bar-ops-api-v3/packages/testing/`](bar-ops-api-v3/packages/testing/) | Role-matrix black-box integration tests (`Admin` / `Manager` / `User`) and gated deploy pipeline |
| [`bar-ops-api-v3/tests/`](bar-ops-api-v3/tests/) | Offline Vitest unit test suites (OCC `409`, pagination >1MB, versioned cache, `RolesGuard`, idempotency, utilities) |
| [`bar-ops-dashboard/src/modules/`](bar-ops-api-v3/../bar-ops-dashboard/src/modules/) | Vue 3 domain modules (`session`, `shift`, `cashier`, `tips`, `sale`, `consume`, `mission`, `employee`, etc.) following `view → composable → provider → repository` |
| [`bar-ops-dashboard/demo/`](bar-ops-dashboard/demo/) | Playwright mock-API harness that runs the real SPA against deterministic fictional data to record the demo GIF and screenshots |
| [`cloudflare/api-proxy/`](cloudflare/api-proxy/) | Cloudflare Worker proxying REST and WebSocket traffic on custom domains |
| [`architecture/`](architecture/) | System map, backend & frontend golden paths, [IaC adoption guide](architecture/infrastructure-as-code.md), [multi-tenancy analysis](architecture/multi-tenancy.md), and [AI workflow contract](architecture/AI-WORKFLOW.md) |

---

## Running Locally

### 1. Frontend Dashboard (`bar-ops-dashboard`)

```bash
cd bar-ops-dashboard
cp .env.example .env.local
npm ci

# Run unit tests (307 tests), type-check, and linter
npm test
npm run type-check
npm run lint

# Launch the interactive demo with deterministic mock data (no AWS credentials needed)
npm run demo
```

### 2. Backend API (`bar-ops-api-v3`)

```bash
cd bar-ops-api-v3
cp .env.example .env.dev
npm ci --ignore-scripts

# Run Lambda & shared-core typecheck and unit tests (108 tests, offline mocks)
npm run typecheck
npm test
```

---

## How I Work with AI Agents

AI coding agents are used on this repository as a pair of hands governed by an explicit architecture contract — never as an autonomous author. Every session starts by reading [`architecture/README.md`](architecture/README.md) (the 7 system invariants and layer checklists) and [`architecture/AI-WORKFLOW.md`](architecture/AI-WORKFLOW.md), plans file-by-file before writing code, and is gated by strict TypeScript checks, ESLint, and unit + role-matrix test suites before commit.

---

## License

Copyright © 2026 Benjamin Hanonove. All rights reserved — shared publicly for portfolio review only. See [LICENSE](LICENSE).
