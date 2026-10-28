# Layer 9 — Auth, tokens & realtime

**Files:** [`src/modules/auth/`](../../bar-ops-dashboard/src/modules/auth/) ·
[`shared/composables/websocket.store.ts`](../../bar-ops-dashboard/src/modules/shared/composables/websocket.store.ts)

## Where credentials live

| Thing | Storage | Lifetime |
| --- | --- | --- |
| Access / Id token | `tokenMemory` — a plain `ref`, deliberately **outside** Pinia and localStorage | until refresh/tab close |
| Refresh token | `HttpOnly; Secure; SameSite=Lax; Path=/auth` cookie set by the API | 30 days |
| User + role | `AuthStore`, **not persisted** — never carries token material | tab lifetime |

An XSS cannot read the refresh cookie, and a page reload drops the access token — which
is why the app rehydrates on boot instead of trusting stored state.

## Session lifecycle

```
main.ts → rehydrateSession()          POST /auth/refresh with the cookie (5s timeout race)
   ├─ success → tokenMemory.set(…), AuthStore populated, router mounts authenticated
   └─ failure/timeout → router mounts, guard redirects to /login

LoginView → useAuthCrud → authProvider.login → tokens in memory + cookie set by the server

token.manager                         proactive refresh at ExpiresIn − 600s
   ├─ concurrent callers share one in-flight promise
   └─ ensureValidToken() before a websocket connect

api.ts response interceptor           reactive refresh on any 401 (except /auth/*)
```

`AuthStore` derives the role from the Cognito groups in the Id token and exposes
`RoleLevel`, `isAdmin`, `isManager` — the same hierarchy the backend guard uses
(`ADMIN` › `MANAGER` › `USER` › `NONE`).

## Roles in the UI

| Where | Mechanism |
| --- | --- |
| Route | `meta.minRole` — the guard redirects to `sessions-list` |
| Page action | `PageHeader :min-role` |
| Row action | `isAdmin` computed guarding the `IListAction` group |

The UI gate is a convenience only — the backend `RolesGuard` is the actual boundary.

## WebSocket

`WebSocketStore` owns one connection for the whole app:

- Connects with `new WebSocket(env.websocket.url, ['barops-auth', token])` — the access
  token rides in the subprotocol, after `ensureValidToken()`.
- **Rooms**: `setRoom(id)` sends `{action: 'joinRoom', roomId}`; the router calls it
  automatically on `/sessions/:id` and `/sales/:id` and clears it elsewhere. Rooms are
  re-sent after a reconnect.
- Some streams (leads) are global and reach every connected user without a room.
- Incoming messages patch the relevant Pinia store (`add`/`update`/`remove` are
  id-idempotent, so an echo of your own write is harmless).
- Disconnects schedule a backoff reconnect while the user is still authenticated.

## Adding a live screen

1. Make sure the backend broadcaster publishes for that entity
   ([../backend/06-events-observers.md](../backend/06-events-observers.md)).
2. Handle the message type in `websocket.store.ts` by calling the store mutation.
3. If it is per-record, add the path to the router's room-sync `afterEach`.
