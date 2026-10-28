# Layer 6 — Store (Pinia)

**Files:** [`config/store/index.ts`](../../bar-ops-dashboard/src/config/store/index.ts) ·
[`config/store/utils/createEntityStore.util.ts`](../../bar-ops-dashboard/src/config/store/utils/createEntityStore.util.ts) ·
`config/store/utils/sortByHebrew.util.ts` ·
`src/modules/<domain>/composables/<x>s.store.ts`

Stores are **caches of server state plus view state**. They never call HTTP; the CRUD
composable writes to them after a successful provider call.

## `createEntityStore<T extends {id: string}>(sort?)`

Gives every collection store the same primitives:

| Member | Behaviour |
| --- | --- |
| `data` | `T[] \| null` — `null` means "not loaded yet", distinct from `[]` |
| `loading`, `error` | with `setLoading` / `setError` |
| `set(items)` | replace + apply the sort |
| `add(item)` | append **or** merge if the id already exists (idempotent for websocket echoes) |
| `update(item)` | shallow-merge by id, keeps the sort |
| `remove(id)`, `get(id)`, `reset()` | |

`sortByHebrew(selector)` gives correct Hebrew alphabetical order — pass it for anything
users scan by name.

## A store file

```ts
export const ClientsStore = defineStore('clients', () => {
  const { data: clients, loading, error, set, add, update, remove, get, setLoading, setError, reset } =
    createEntityStore<IClient>(sortByHebrew((c) => c.name))

  const searchQuery = ref('')
  const filtered = computed(() => { … })

  return { clients, loading, error, searchQuery, filtered, set, add, update, remove, get, setLoading, setError, reset }
})
```

Rename `data` to the domain name on destructure (`clients`, `sessions`, `products`) —
views read `clientsStore.clients`, and `useCrud` still finds the underlying `data`.

## Two kinds of store

- **Collection stores** (`ClientsStore`, `SessionsStore`, plural) — the entity list.
- **Single-entity stores** (`SessionStore`, `SaleStore`, singular) — the currently open
  record plus its derived view state, used by detail screens.

## Registration

Export it from `modules/<x>/index.ts`, then re-export from
[`config/store/index.ts`](../../bar-ops-dashboard/src/config/store/index.ts) so
everything imports from `@stores`. Pinia is created there with
`pinia-plugin-persistedstate` available for stores that opt in.

## Loading data

`app-init.service.ts` runs one `runTask(name, store, provider.list)` per store on the
first authenticated navigation: it toggles `loading`, `set`s the data, and raises a
Hebrew snackbar on failure. Add your store there if the list should be warm before the
user opens the screen; skip it for data only fetched on a detail page.
