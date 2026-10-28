# Layer 3 — Types (the contract)

**Files:** `src/modules/<domain>/types/I<X>.types.ts`, `I<X>Repository.types.ts` ·
shared contracts in [`src/modules/shared/types/`](../../bar-ops-dashboard/src/modules/shared/types/)

## The three interfaces

They mirror the backend DTOs one-for-one
([../backend/04-dtos-validation.md](../backend/04-dtos-validation.md)):

| Frontend | Backend | Rule |
| --- | --- | --- |
| `ICreate<X>` | `Create<X>Dto` | same required/optional fields |
| `IUpdate<X>` | `Update<X>Dto` | all fields optional **plus `id` and `timestamp`** |
| `I<X>` | `<X>Dto` | `extends ICreate<X>` + `id` + `timestamp` |

`timestamp` on `IUpdate<X>` is the optimistic-concurrency token. `useCrud` reads the
freshest one from the store and attaches it to every update; without it the backend
cannot detect a conflicting edit.

## Hard rules

- **`I*` types describe what the server stores — nothing else.** A value the UI needs
  but the API does not persist is a `computed` inside the component or composable, never
  a new interface field. Adding a field the DTO does not have produces payloads the
  backend strips (`whitelist: true`) and a contract that silently drifts.
- **No `any`, and no `as any` casts.** Use a type intersection, a union, or a type
  guard. Where the codebase must widen (`object as T`), it goes through a two-step cast,
  which is a deliberate signal that a boundary is being crossed.
- Enums that exist on both sides (`UserRole`, `EmployeeStatus`, session statuses) are
  declared once per side and must keep identical string values.

## Shared contracts worth knowing

| Type | Use |
| --- | --- |
| `IApiResponse<T>` / `IRawResponse<T>` | `{data, statusCode, message}` and the raw envelope |
| `IProviderResult<T>` | `{success, message, data, statusCode}` — every provider call |
| `IFormField`, `FormValue`, `ISelectItem`, `ValidationRule` | the declarative form system |
| `IListAction` | one action-menu row (`title`, `icon`, `color`, `handler`) |
| `ICrudProvider` / `ICrudStore` | what `useCrud` requires of a provider and a store |
| `IStatusMeta`, `ISegment`, `ISummaryMetric`, `ISummaryReport` | status chips, tabs, summary cards, report blobs |

## The repository interface

```ts
export interface IVendorNoteRepository {
  create(data: ICreateVendorNote): Promise<IApiResponse<IVendorNote>>
  delete(id: string): Promise<IApiResponse<boolean>>
  get(id: string): Promise<IApiResponse<IVendorNote>>
  list(ids: string[]): Promise<IApiResponse<IVendorNote[]>>
  update(id: string, data: IUpdateVendorNote): Promise<IApiResponse<IVendorNote>>
}
```

Declaring the repository as this interface (`const repo: IVendorNoteRepository = new
BaseRepository<…>(…)`) is what makes a generic-argument mistake a compile error instead
of a runtime surprise.
