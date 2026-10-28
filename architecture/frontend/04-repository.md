# Layer 4 — Repository (HTTP)

**Files:** [`shared/repository/api.ts`](../../bar-ops-dashboard/src/modules/shared/repository/api.ts) ·
[`shared/repository/base.repository.ts`](../../bar-ops-dashboard/src/modules/shared/repository/base.repository.ts)

The only layer that knows HTTP exists. Views, composables and stores never import
axios.

## `api.ts` — the single axios instance

- `baseURL: env.api.baseUrl`, `timeout: env.api.timeoutMs`, `withCredentials: true`
  (so the `HttpOnly` refresh cookie travels).
- **Request interceptor**: attaches `Authorization: Bearer <AccessToken>` from
  `tokenMemory` (in-memory only — never localStorage).
- **Response interceptor**: on `401`, refreshes once and replays the request.
  - `/auth/login`, `/auth/refresh`, `/auth/logout` are excluded — a 401 there means the
    session is genuinely over.
  - Concurrent 401s queue on `refreshQueue` so only one refresh call is made, then all
    are replayed with the new token.
  - `_retried` guarantees at most one retry per request.
  - Refresh failure → `authStore.logout()` + redirect to `login`.

## `BaseRepository<TEntity, TCreate, TUpdate, TGet, TListArg>`

```ts
new BaseRepository<IClient, ICreateClient, IUpdateClient>('/client', 'clients', 'client')
```

| Method | Call | Notes |
| --- | --- | --- |
| `list(arg?)` | `GET /client` | array arg → path segments (`/client/id1/id2`); object arg → query params |
| `get(id)` | `GET /client/:id` | |
| `create(payload)` | `POST /client` | |
| `update(id, payload)` | `PUT /client/:id` | payload carries `id` + `timestamp` |
| `delete(id)` | `DELETE /client/:id` | returns `data: boolean` from the status code |

`wrap()` normalizes the backend envelope into `IApiResponse<T>`: it looks for
`body.data[key]` (the plural/singular key you passed), falls back to `body.data`, then
to the supplied fallback (`[]` or `{}`) — so a handler returning `data` directly and one
returning `data: { client }` both work, and a shape change degrades to an empty value
rather than a crash.

`downloadBlob(path, fileName, params)` (protected) handles report downloads via
`parseBlobResponse`.

`BaseReceiptRepository` extends it with `presign(...)` / `unsign(...)` for the S3
receipt flow — extend that one when a resource has receipt images.

## Extending

Add resource-specific calls by subclassing, keeping the generic CRUD inherited:

```ts
class SessionRepository extends BaseRepository<ISession, ICreateSession, IUpdateSession> {
  async summary(id: string) { return this.downloadBlob(`/session/${id}/summary`, `session-${id}.pdf`) }
}
```
