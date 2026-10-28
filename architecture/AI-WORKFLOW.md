# KICK — AI workflow

How AI agents are used on this codebase: they are a pair of hands, not an author.
Every agent session starts by reading the architecture contract in this folder
(the layering rules, naming, the per-module docs) before it touches code, and it works
inside those rules. Every change an agent produces is reviewed by me before it is
committed: diffs are read, type-checks, lint and tests are run, and anything that
needs a console step is handed back as a checklist rather than claimed as done.

The rest of this file is the start-of-chat prompt every agent gets.

> **How to use:** paste this whole file (or `@architecture/AI-WORKFLOW.md`) as the
> first message of a new chat with any coding agent (Claude Code, Codex, Cursor, Copilot...).

---

You are working on **KICK** (internal codename BarOps), a production bar-operations
platform: a Vue 3 dashboard and a serverless AWS API, both TypeScript, Hebrew/RTL,
serving real venues with real money and real staff data. Treat it as production at all
times.

## STEP 0 — Read before you do anything else

Read these files in this order. Do not answer questions, propose designs, or write code
until you have. If your tool cannot read files, say so and ask me to paste them.

**Always:**
1. `architecture/README.md` — system map, request trace, the 7 invariants, and what is console-managed
2. `architecture/backend/README.md` — backend layers + the 10-step golden path
3. `architecture/frontend/README.md` — frontend layers + the 11-step golden path

**Then, whichever layers the task touches:**

| Backend | Frontend |
| --- | --- |
| `architecture/backend/01-infrastructure.md` | `architecture/frontend/01-app-shell.md` |
| `architecture/backend/02-handlers.md` | `architecture/frontend/02-routing.md` |
| `architecture/backend/03-guards.md` | `architecture/frontend/03-types.md` |
| `architecture/backend/04-dtos-validation.md` | `architecture/frontend/04-repository.md` |
| `architecture/backend/05-data-access.md` | `architecture/frontend/05-provider.md` |
| `architecture/backend/06-events-observers.md` | `architecture/frontend/06-store.md` |
| `architecture/backend/07-utils-messages.md` | `architecture/frontend/07-composables.md` |
| `architecture/backend/08-testing-deploy.md` | `architecture/frontend/08-views-components.md` |
| | `architecture/frontend/09-auth-realtime.md` |

Then confirm in **five lines or fewer**: what you read, which layers the task touches,
and the one file you will copy as a template. Do not paraphrase the docs back to me.

## STEP 1 — Plan before you write code. Always.

**No code, no edits, no file writes until I approve a plan.** This is not optional and
it applies to "quick" changes too.

- **Claude Code** — enter plan mode (Shift+Tab until it says *plan mode*), present the
  plan, wait for approval.
- **Cursor / Windsurf / Antigravity** — use the planning / Ask mode, produce the plan
  artifact, wait for approval before switching to agent/write mode.
- **Codex, Copilot, anything else** — write the plan as a chat message and stop.

A plan for this repo must name:
1. Every file you will create or modify, with its layer.
2. The existing file you are copying as the template (there is almost always one).
3. Any **console work I have to do myself** — DynamoDB table/GSI, API Gateway route,
   CORS, Cognito. These are never in code and the deploy will not create them.
4. How it will be verified (type-check, lint, which test suite).
5. Anything you are unsure about — ask instead of assuming.

Then: **one task at a time.** Do the single task, show me the result, and wait for my
go-ahead before starting the next. Do not batch five changes into one turn.

## STEP 2 — Build it the way the repo already does

Nothing here is new — it is what the code already does. Match it.

### Universal
- **No `any`, no `as any`.** Use type intersections, unions, or type guards.
- **No `console.error` / `console.log` in catch blocks.** Backend: `logger.error(err)`.
  Frontend: a snackbar. Logged internals are an information leak.
- **Comments are short single-line `//` notes** explaining *why*. No comment blocks, no
  banner headers, no restating the code.
- **Never read or print `.env*` files.** They hold live secrets. Derive variable names
  from `config.env.ts` / `src/config/env/env.ts` instead.
- **Never edit `dist/`.** It is build output. Change `src/` and rebuild.
- **No git commands without my explicit permission** — no commit, push, checkout,
  branch, reset, or `git add`. Show me the diff and let me decide.
- **Brand:** user-facing copy says **KICK 🍸**. Internal names (`BarOps-*` tables, app
  name, protocol strings) stay as they are — never rename them.
- User-facing strings are **Hebrew**.

### Backend (`bar-ops-api-v3`)
- One Lambda per action: `packages/functions/<resource>/<action>/index.ts`. No routers.
- Every handler is wrapped in `RolesGuard([UserRole…])`. Authorization is never inline.
- Validate with DTOs (`validateBody`) — three classes per resource: `Create*Dto`,
  `Update*Dto` (all optional **plus `timestamp!`**), `<X>Dto` (read shape).
- **Never touch `docClient` directly.** Use `create` / `get` / `list` / `update` /
  `remove` from `@aws/dynamo/*` — they own caching, OCC, `lastEditor` and validation.
- Hebrew copy comes from `new ResourceMessages(singular, plural)`.
- Responses are `{ message, data }` with a `StatusCodes` constant. 409 = stale
  `timestamp`, and the frontend already knows how to recover from it.
- Async side effects (cascades, notifications, live push) go to observers on the event
  bus, never into the request path.

### Frontend (`bar-ops-dashboard`)
- The chain is **view → composable → provider → repository → `api.ts`**. Never skip a
  link, never import axios in a view or store.
- `ICreate<X>` / `IUpdate<X>` / `I<X>` mirror the backend DTOs field for field,
  including `timestamp` on the update interface.
- **`I*` types describe what the server stores.** A value the UI needs but the API does
  not persist is a `computed`, never a new interface field.
- State lives in Pinia stores built on `createEntityStore`; CRUD behaviour comes from
  `useCrud` — do not hand-roll dialogs, diffing, snackbars or 409 recovery.
- Form fields are declared as `IFormField[]` in the CRUD composable, not in the view.
- Build UI from the shared components (`PageHeader`, `AppTable`, `AppDialog`,
  `GenericForm`, `AppCard`, `AppButton`…), not raw Vuetify. Action menus are `AppList`
  with `IListAction[][]`, and destructive actions get their own group.
- Role gating: `meta.minRole` on routes, `min-role` on `PageHeader`, `isAdmin` computed
  on destructive actions. The UI gate is convenience — the backend guard is the boundary.
- New module alias goes in **both** `vite.config.ts` and `tsconfig.app.json`.

## STEP 3 — Definition of done

A task is finished when:

```bash
# frontend
cd bar-ops-dashboard && npm run type-check && npx eslint .
# backend
cd bar-ops-api-v3 && npx tsc --noEmit
```

both pass, plus — for backend changes — the black-box suite:

```bash
cd bar-ops-api-v3 && npm run test:dev      # all lifecycles × admin/manager/user
```

Report honestly: if something fails, show the output. If you skipped a step, say so.
Never claim a manual/console step is done — list it for me to do.

## Environment facts you will otherwise get wrong

- Two stages: **dev** and **production** (`api.kicks.ltd`), each with its own HTTP API (`<HTTP_API_ID>` in `.env.<stage>`).
- **Local `npm run dev` must point at the dev gateway.** The production API's CORS
  allowlist contains `https://kicks.ltd` only, so localhost preflights fail against it.
- DynamoDB tables, GSIs, API Gateway routes, CORS, throttling, the WebSocket API and
  Cognito are **created by hand in the AWS console** and only referenced by the IaC.
  Deploying does not create them.
- The dashboard is served by Cloudflare Pages (`kicks.ltd`) with an edge middleware for
  link previews; `public/_headers` and `public/_redirects` are part of the deploy.
- Production deploys go through `npm run deploy:barops`: deploy dev → run every test →
  deploy production, aborting before production if anything fails.

## How to talk to me

- Reference code as clickable paths, e.g. `bar-ops-dashboard/src/modules/client/views/ClientView.vue:42`.
- Don't re-explain code I did not ask about, and don't summarize what you just read.
- If a request conflicts with the architecture, say so in a sentence and propose the
  in-pattern alternative — then do what I decide.
- If you are missing information, ask. Do not invent a table name, a route, or a field.
