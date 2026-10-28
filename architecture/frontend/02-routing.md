# Layer 2 — Routing & the navigation guard

**File:** [`src/config/router/index.ts`](../../bar-ops-dashboard/src/config/router/index.ts)

## Auto-discovery

```ts
const modules = import.meta.glob<{ routes?: RouteRecordRaw[] }>('../../modules/*/index.ts', { eager: true })
```

Every module that exports `routes` from its `index.ts` is merged into the route table.
There is no central list to edit — a module is added by existing.

Convention inside a module: `router/index.ts` declares the base path and wraps children
in `AppLayout` (the app chrome), `router/src/<name>.route.ts` declares the leaf with a
lazily imported view.

## Route meta contract

```ts
interface RouteMeta {
  isPublic?: boolean      // reachable without a session (login, self-registration)
  title?: string          // document title + og:title
  description?: string    // meta description + og:description
  image?: string          // og:image override
  minRole?: UserRole      // minimum role to enter
}
```

## `beforeEach` — four jobs in order

1. **No user** → reset the init flag; `meta.isPublic` routes pass, everything else
   logs out and redirects to `login`.
2. **First authenticated navigation** → `useAppInitialization().loadDashboardData()`
   populates the shared stores once per session (guarded by a module-level flag).
3. **Role gate** → `RoleLevel[user.role] < RoleLevel[meta.minRole]` redirects to
   `sessions-list` rather than showing an error.
4. `next()`.

## `afterEach` — two jobs

- `applyRouteHead(to)` writes `document.title` and the `description` / `og:*` /
  `twitter:*` tags, falling back to the KICK defaults. (Crawler previews are handled at
  the edge; this is for live tabs.)
- WebSocket room sync: on `/sessions/:id` and `/sales/:id` it calls
  `WebSocketStore().setRoom(id)`, and clears the room elsewhere.

## Adding a protected, role-gated page

```ts
const route: RouteRecordRaw = {
  path: '',
  name: 'vendor-notes',
  component: () => import('@vendorNote/views/VendorNoteView.vue'),
  meta: { title: 'הערות ספק', description: '…', minRole: UserRole.MANAGER },
}
```

Always lazy-import the view — it is what keeps the initial bundle small (and what the
stale-chunk recovery in `router.onError` protects).
