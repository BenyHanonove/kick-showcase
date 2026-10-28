# Layer 7 — Composables

**Files:** [`shared/composables/`](../../bar-ops-dashboard/src/modules/shared/composables/) ·
`src/modules/<domain>/composables/<x>.crud.ts`

This is where UI behaviour lives: dialogs, submission, feedback, search, filters.
Views should read as layout; composables carry the logic.

## `useCrud(provider, store, getCurrentItems?, createFields?, updateFields?)`

[`crud.composable.ts`](../../bar-ops-dashboard/src/modules/shared/composables/crud.composable.ts)
returns the complete dialog+mutation surface:

| Returned | Meaning |
| --- | --- |
| `createDialogOpen`, `isCreating`, `handleCreate(form)` | create flow |
| `selectedItem`, `updateDialogOpen`, `isUpdating`, `openUpdate(item)`, `handleUpdate(form)` | update flow |
| `deleteDialogOpen`, `isDeleting`, `openDelete(item)`, `handleDelete()` | delete flow |

What it does that you would otherwise hand-write every time:

1. **Payload building** — `buildPayload(fields, form)` trims strings, strips RTL bidi
   control characters (a real problem when phone numbers are pasted from Hebrew contact
   apps), converts `''` → `undefined`, and coerces `number` fields.
2. **Diffing** — `openUpdate` freezes a snapshot; `handleUpdate` sends **only changed
   fields**. No changes → `'לא בוצעו שינויים'` info snackbar and no request.
3. **Concurrency** — attaches the freshest `timestamp` from the store, and on `409`
   refetches the record, updates the store, and shows
   `'הנתונים עודכנו על ידי משתמש אחר…'` instead of an error.
4. **Store sync** — `store.add` / `store.update` / `store.remove` on success.
5. **Feedback** — success/error snackbars from the server's Hebrew `message`.

## The per-domain CRUD composable

```ts
export const useClientCrud = () => {
  const crud = useCrud(clientProvider, ClientsStore())
  const clientInitialState: ICreateClient = { name: '', brand: '', email: '', phone: '' }
  const clientFields: IFormField[] = [
    { key: 'name',  label: 'שם מלא*',     type: 'text', rules: [rules.required()] },
    { key: 'brand', label: 'מותג / חברה*', type: 'text', rules: [rules.required()] },
    { key: 'email', label: 'אימייל',      type: 'text' },
    { key: 'phone', label: 'מספר טלפון*',  type: 'text', rules: [rules.required()] },
  ]
  return { ...crud, clientFields, clientInitialState }
}
```

Field definitions live **here**, not in the view: `GenericForm` renders them and
`buildPayload` uses the same array, so one edit changes both the UI and the payload.
Pass `createFields` / `updateFields` into `useCrud` when the two forms differ.

## Other shared composables

| Composable | Use |
| --- | --- |
| `useSearch(items, keys)` | client-side search → `{query, results}`, bound to `PageHeader` |
| `useCalendarFilter` | date-range filtering for calendar screens |
| `useRouteQueryTab` | keeps the active tab in the URL query |
| `useFormatter` | currency / number / date formatting inside `<script setup>` |
| `formSubmit.composable` | standalone form submission outside the CRUD flow (login, registration) |
| `snackbar.store` | `SnackbarStore().open(message, 'success' \| 'error' \| 'warning' \| 'info')` |
| `websocket.store` | connection + room membership (see [09-auth-realtime.md](09-auth-realtime.md)) |
| `app-init.service` | the login-time data load |

## Rules

- Domain calculations get their own composable (`session.calc.ts`), not a fat view.
- Anything derived from server state is a `computed`, never a stored field.
- No `console.error` in catch blocks — surface a snackbar; the server already logged it.
