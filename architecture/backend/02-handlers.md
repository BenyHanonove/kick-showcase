# Layer 2 — Handlers

**Files:** `packages/functions/<resource>/<action>/index.ts` (+ optional `events.json`)

One file = one Lambda = one HTTP route. There is no controller, no router, no service
class. Business logic that is genuinely shared goes to `packages/shared/utils/`.

## Anatomy

Every handler is the same five moves — see
[`client/update/index.ts`](../../bar-ops-api-v3/packages/functions/client/update/index.ts)
for the fullest version:

```ts
import 'reflect-metadata';                      // 1. required by class-validator/-transformer

const MESSAGES = new ResourceMessages('לקוח', 'לקוחות');   // 2. Hebrew copy, module scope

export const handler = RolesGuard([UserRole.ADMIN], async (event) => {  // 3. authorization
  try {
    const id = extractId(event, 'id', MESSAGES.ERROR.MISSING_ID);
    if (typeof id !== 'string') return id;      // extractId returns a 400 response on failure

    const { data: body, error } = await validateBody(event, UpdateClientDto, MESSAGES.ERROR.VALIDATION_FAILED);
    if (error) return error;                    // 4. validation → 400

    const instance = await update(process.env.TABLE!, id, body, ClientDto);  // 5. data helper
    if (!instance) return { statusCode: StatusCodes.NOT_FOUND, body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }) };

    return { statusCode: StatusCodes.OK, body: JSON.stringify({ message: MESSAGES.SUCCESS.UPDATED, data: instance }) };
  } catch (err) {
    logger.error(err);
    return { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }) };
  }
});
```

## Response contract

Always `{ message: string, data?: T }` with a `StatusCodes` constant — never a bare
number. The frontend `BaseRepository` unwraps exactly this shape.

| Situation | Status | Body |
| --- | --- | --- |
| created | `201` | `{message, data}` |
| read / updated / deleted | `200` | `{message, data}` |
| bad payload / missing id | `400` | `{message, errors}` |
| role not allowed | `403` | `{message}` (emitted by the guard) |
| id not found | `404` | `{message}` |
| stale `timestamp` | `409` | `{message}` — the frontend refetches |
| anything unhandled | `500` | `{message}` |

## Rules

- **Never call `docClient` directly.** Use the helpers in
  [05-data-access.md](05-data-access.md) so caching, OCC, `lastEditor` and DTO
  validation stay consistent.
- **Never build Hebrew strings inline.** `ResourceMessages` handles gender agreement.
- `logger.error` only — the shared logger is silent in production paths that must not
  leak internals.
- The inner `try/catch` around the data helper distinguishes *validation* failures
  (400) from *conflict* (409) and unexpected failures (500).

## Non-CRUD actions

Same shape, different verb folder — the codebase already has `presign` / `unsign`
(S3 receipts), `batch`, `sync-tips`, `summary`, `claim`, `link`, `revoke`, `resolve`,
`register`, `notify`, `broadcast`. Name the folder after the action and the Lambda name
follows automatically.

## `events.json`

An array of `{ name, content }` objects placed next to a handler. The deploy registers
them as Lambda console test events — cheap way to keep a realistic payload around for
manual testing.
