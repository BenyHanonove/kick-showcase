# Layer 7 — Shared utils & messages

**Files:** [`packages/shared/utils/`](../../bar-ops-api-v3/packages/shared/utils/)

Import via the `@utils/*`, `@dtos/*`, `@aws/*`, `@guards/*`, `@env/*` path aliases
declared in [`tsconfig.json`](../../bar-ops-api-v3/tsconfig.json) — never with relative
`../../..` chains.

| Folder | What it gives you |
| --- | --- |
| `messages/resource.util.ts` | `ResourceMessages` — Hebrew copy factory |
| `request/request.util.ts` | `validateBody`, `validateInstance`, `extractId`, `extractQueryParam` |
| `auth/` | `buildUserFromIdToken`, refresh-cookie builders, `isAllowedOrigin` |
| `token/` | signed one-time tokens (employee self-registration links) |
| `logger/logger.util.ts` | the only logging entry point |
| `date/` | shift/session date math |
| `mappers/` | entity → view shape conversions shared by summaries |
| `whatsapp/` | template message sending (keep copy **transactional/UTILITY**) |
| `file-generation/`, `image/`, `z-report/` | PDF/Excel generation, image compression, Z-report assembly |

## `ResourceMessages`

```ts
const MESSAGES = new ResourceMessages('לקוח', 'לקוחות');
MESSAGES.SUCCESS.CREATED   // "לקוח נוצר בהצלחה"
MESSAGES.ERROR.NOT_FOUND   // "לקוח לא נמצא"
```

Give it the singular and plural Hebrew noun and it generates the full set with correct
**gender agreement** — a noun ending in `ה`/`ת` is treated as feminine
(`נוצרה` vs `נוצר`). Extra strings go through the typed `overrides` argument:

```ts
new ResourceMessages('משמרת', 'משמרות', {
  ERROR: { ALREADY_ASSIGNED: 'המשמרת כבר משובצת' },
});
```

Standard keys: `SUCCESS.{CREATED, UPDATED, DELETED, LOADED, LIST_LOADED,
RECEIPT_UPLOADED, RECEIPT_DELETED}` and `ERROR.{NOT_FOUND, ALREADY_EXISTS, MISSING_ID,
INVALID_ID, INTERNAL_SERVER_ERROR, VALIDATION_FAILED, CREDENTIALS_ALREADY_EXISTS,
MISSING_PARAMS, CONCURRENCY_CONFLICT}`.

## Logging

`logger.error(err)` in the outer catch, and nowhere else in a happy path. Messages that
reach the client come from `ResourceMessages`; raw errors stay in CloudWatch.

## WhatsApp

Template messages must read as transactional (UTILITY category). Marketing-sounding
copy gets "accepted" by the API and then silently dropped by frequency caps.
