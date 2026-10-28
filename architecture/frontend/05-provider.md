# Layer 5 — Provider (the error boundary)

**File:** [`shared/providers/base.provider.ts`](../../bar-ops-dashboard/src/modules/shared/providers/base.provider.ts)

One job: turn "an axios call that might throw" into a value that a composable can branch
on without a `try/catch`.

```ts
export interface IProviderResult<TData> {
  success: boolean
  message: string          // already Hebrew, already user-safe
  data: TData | null
  statusCode?: number
}
```

## How it works

- `safeCall(request, expected = StatusCodes.OK)` awaits the repository call, then
  `handle()`s it; anything thrown is converted via `extractErrorMessage(error, 'ארעה
  שגיאה בלתי צפויה בתקשורת עם השרת')` with the real status code preserved.
- `handle()` compares `statusCode` to the expected one — a `201` from create is
  declared, not assumed.
- **`statusCode` survives on failures**, which is what lets `useCrud` recognise a `409`
  and recover instead of just showing an error.

## Writing one

```ts
export const vendorNoteProvider = new BaseCrudProvider<IVendorNote, ICreateVendorNote, IUpdateVendorNote>(
  vendorNoteRepository,
)
```

That is the whole file for a standard resource. For extra endpoints, subclass:

```ts
class SessionProvider extends BaseCrudProvider<ISession, ICreateSession, IUpdateSession> {
  async close(id: string, payload: ICloseSession) {
    return this.safeCall(sessionRepository.close(id, payload))
  }
}
```

## Rules

- Providers are **stateless singletons** — no refs, no store access, no snackbars.
  Feedback belongs to the composable layer.
- Never re-throw. A provider returning `{success: false}` is the contract; a thrown
  error means someone bypassed `safeCall`.
- Never log the error object. The user-facing message comes from
  `extractErrorMessage`, which reads the backend's `message` field.
