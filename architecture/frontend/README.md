# Frontend — `bar-ops-dashboard`

Vue 3 + TypeScript SPA (Vite, Vuetify 3, Pinia), Hebrew/RTL, deployed as static files to
Cloudflare Pages. The architecture is **modular monolith**: one folder per domain under
`src/modules/`, each a complete vertical slice with identical internal layers.

## Module anatomy

```
src/modules/<domain>/
├── types/          I<X>.types.ts, I<X>Repository.types.ts   ← contract (mirrors backend DTOs)
├── repository/     <x>.repository.ts                        ← HTTP, via BaseRepository
├── providers/      <x>.provider.ts                          ← error → {success, message, data}
├── composables/    <x>s.store.ts, <x>.crud.ts               ← Pinia state + UI logic
├── components/     <X>Card.vue, …                           ← domain widgets
├── views/          <X>View.vue                              ← routed pages
├── router/         index.ts + src/<x>.route.ts              ← routes
└── index.ts        export routes + stores                   ← what the app auto-discovers
```

## Layers

| # | Layer | Doc |
| --- | --- | --- |
| 1 | App shell & config | [01-app-shell.md](01-app-shell.md) |
| 2 | Routing & navigation guard | [02-routing.md](02-routing.md) |
| 3 | Types (the contract) | [03-types.md](03-types.md) |
| 4 | Repository (HTTP) | [04-repository.md](04-repository.md) |
| 5 | Provider (error boundary) | [05-provider.md](05-provider.md) |
| 6 | Store (Pinia) | [06-store.md](06-store.md) |
| 7 | Composables (`useCrud` & friends) | [07-composables.md](07-composables.md) |
| 8 | Views & the KICK component system | [08-views-components.md](08-views-components.md) |
| 9 | Auth, tokens & realtime | [09-auth-realtime.md](09-auth-realtime.md) |

## Golden path — add a new module

Worked example: **`vendorNote`**, backed by the API resource from
[../backend/README.md](../backend/README.md). Copy
[`src/modules/client/`](../../bar-ops-dashboard/src/modules/client/) — it is the
reference implementation and every file below is under 60 lines.

### Step 1 — Types (mirror the DTOs exactly)

`types/IVendorNote.types.ts`:

```ts
export interface ICreateVendorNote { title: string; body?: string }
export interface IUpdateVendorNote { id: string; timestamp: string; title?: string; body?: string }
export interface IVendorNote extends ICreateVendorNote { id: string; timestamp: string }
```

Plus `types/IVendorNoteRepository.types.ts` declaring the five methods returning
`IApiResponse<…>`. Rules and traps: [03-types.md](03-types.md).

### Step 2 — Repository

```ts
const vendorNoteRepository: IVendorNoteRepository = new BaseRepository<
  IVendorNote, ICreateVendorNote, IUpdateVendorNote
>('/vendor-note', 'vendorNotes', 'vendorNote')
export default vendorNoteRepository
```

Three arguments: endpoint path, plural response key, singular response key.

### Step 3 — Provider

```ts
export const vendorNoteProvider = new BaseCrudProvider<IVendorNote, ICreateVendorNote, IUpdateVendorNote>(
  vendorNoteRepository,
)
```

### Step 4 — Store

`composables/vendorNotes.store.ts` — `defineStore` around `createEntityStore`, exposing
the entity list under a domain name plus any computed filters:

```ts
export const VendorNotesStore = defineStore('vendorNotes', () => {
  const { data: vendorNotes, loading, error, set, add, update, remove, get, setLoading, setError, reset } =
    createEntityStore<IVendorNote>(sortByHebrew((n) => n.title))
  return { vendorNotes, loading, error, set, add, update, remove, get, setLoading, setError, reset }
})
```

### Step 5 — CRUD composable

`composables/vendorNote.crud.ts` — wires the provider to the store and declares the
form:

```ts
export const useVendorNoteCrud = () => {
  const crud = useCrud(vendorNoteProvider, VendorNotesStore())
  const vendorNoteInitialState: ICreateVendorNote = { title: '', body: '' }
  const vendorNoteFields: IFormField[] = [
    { key: 'title', label: 'כותרת*', type: 'text', rules: [rules.required()] },
    { key: 'body', label: 'תוכן', type: 'textarea' },
  ]
  return { ...crud, vendorNoteFields, vendorNoteInitialState }
}
```

You now have `createDialogOpen`, `handleCreate`, `openUpdate`, `handleUpdate`,
`openDelete`, `handleDelete`, loading flags, snackbars, and 409 recovery — for free.

### Step 6 — View

`views/VendorNoteView.vue` — copy `ClientView.vue`: `PageHeader` (title, breadcrumb,
search, role-gated actions) + `AppTable` + three `AppDialog`s (create / update / delete)
driven by `GenericForm` and the `crud` flags. Details:
[08-views-components.md](08-views-components.md).

### Step 7 — Routes

`router/src/vendor-notes.route.ts` (the leaf, with `meta.title` / `meta.description`)
and `router/index.ts` (wraps children in `AppLayout` and sets the base path):

```ts
const vendorNoteRoutes: RouteRecordRaw[] = [{
  path: '/vendor-notes',
  component: () => import('@shared/components/layout/AppLayout.vue'),
  meta: { isPublic: false },
  children: [vendorNotesRoute],
}]
```

### Step 8 — Module index

```ts
import vendorNoteRoutes from './router'
export { VendorNotesStore } from './composables/vendorNotes.store'
export const routes = vendorNoteRoutes
```

The router auto-discovers every `modules/*/index.ts` that exports `routes` — no central
route list to edit.

### Step 9 — Register the alias (both files)

- [`vite.config.ts`](../../bar-ops-dashboard/vite.config.ts) → `resolve.alias`
- [`tsconfig.app.json`](../../bar-ops-dashboard/tsconfig.app.json) → `compilerOptions.paths`

```ts
'@vendorNote': fileURLToPath(new URL('./src/modules/vendorNote', import.meta.url)),
```

Miss either one and you get a dev-server resolve error or red squiggles with a passing
build — always do both.

### Step 10 — Wire it into the app

| Where | Why |
| --- | --- |
| [`src/config/store/index.ts`](../../bar-ops-dashboard/src/config/store/index.ts) | re-export the store so `@stores` resolves it |
| [`app-init.service.ts`](../../bar-ops-dashboard/src/modules/shared/composables/app-init.service.ts) | add a `runTask` if the list must be preloaded at login |
| `AppDrawer.vue` | add `{ title, value, to, icon, count }` for the sidebar entry |

### Step 11 — Verify

```bash
npm run type-check && npx eslint .
npm run dev            # against the dev API stage
```

## Checklist

- [ ] `I*` types mirror the DTOs (including `timestamp` on `IUpdate*`)
- [ ] Repository keys match the API response wrapper
- [ ] Store registered in `@stores`
- [ ] CRUD composable owns the form fields, the view owns layout only
- [ ] Alias added to **both** `vite.config.ts` and `tsconfig.app.json`
- [ ] Route exported through `modules/<x>/index.ts`
- [ ] Role gating: `meta.minRole` on the route, `isAdmin` on destructive actions
- [ ] `type-check` + `eslint` clean
