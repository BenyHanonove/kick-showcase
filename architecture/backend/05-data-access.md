# Layer 5 — Data access (DynamoDB + Redis + concurrency)

**Files:** [`packages/shared/aws/dynamo/`](../../bar-ops-api-v3/packages/shared/aws/dynamo/)
(`create` · `get` · `list` · `update` · `delete` · `item` · `client`) ·
`packages/shared/aws/redis/client.redis.ts`

Five functions cover almost every handler in the codebase. Each one does *five* jobs at
once, which is why handlers must never bypass them.

| Helper | Signature | Does |
| --- | --- | --- |
| `create` | `(table, body, Dto, dateSplitKeys?)` | uuid + `timestamp`, validate, split date parts, stamp `lastEditor`, `PutCommand`, bump cache version, prime cache |
| `get` | `(table, id, Dto, dateSplitKeys?)` | cache read → `GetCommand` → recombine date → validate → cache write |
| `list` | `(table, Dto, options?, dateSplitKeys?)` | cache read by query hash → `Query` (if `keyConditionExpression`) or `Scan` → validate each |
| `update` | `(table, id, body, Dto, dateSplitKeys?)` | strip `id`/`timestamp`/undefined, new `timestamp`, `lastEditor`, **conditional** `UpdateCommand`, bump version, strip `lastEditor` from the response |
| `remove` / `cascadeDeleteByField` | `(table, id)` / `(table, index, field, value, key?)` | delete (or batch-delete children with retry+jitter), bump version |

## Optimistic concurrency (OCC)

The whole app's write safety lives in one condition expression in `update.dynamo.ts`:

```
attribute_exists(id) AND (attribute_not_exists(#ts) OR #ts = :expectedTimestamp)
```

- The client sends the `timestamp` it last saw.
- Match → the row is written and gets a **new** `timestamp`.
- Mismatch → `ConditionalCheckFailedException` → the helper re-reads the row to tell
  the two cases apart: row gone → `null` (handler returns `404`); row changed →
  `ConcurrencyConflictError` (handler returns `409`).
- The frontend turns that `409` into "reload and try again" automatically —
  see [../frontend/07-composables.md](../frontend/07-composables.md).

## Caching model

Redis is used as a **versioned** cache, so nothing is ever hand-invalidated:

```
version:<table>                     ← INCR on every write
get:<table>:<version>:<id>          ← single item
list:<table>:<version>:<queryHash>  ← list result, hashed on index/filters/values
```

A write bumps the version, which orphans every old key at once; orphans expire on
`CACHE_TTL_SECONDS`. Every Redis call is wrapped in try/catch — **cache failures never
fail a request**, they fall through to DynamoDB.

## The split-date GSI pattern

`item.dynamo.ts` implements a storage-only partitioning trick for time-series tables
(sessions, sales):

- On write, `datetime` is split into `monthYear` (`"2026-09"`) + `day` (`4`) so a GSI
  can partition by month and range by day.
- On read, `recombineDatetime()` rebuilds `datetime` so the DTO — and therefore the API
  — never exposes the storage fields.

Pass `dateSplitKeys` to the helper; defaults are `monthYear` / `day` / `datetime`.

## Querying with `list`

```ts
await list(process.env.TABLE!, SaleDto, {
  indexName: 'SessionIdIndex',
  keyConditionExpression: 'sessionId = :sid',
  expressionAttributeValues: { ':sid': sessionId },
});
```

No `keyConditionExpression` → full `Scan`. Fine for small reference tables (clients,
products), not for event data — add a GSI and query it.

## Rules

- Handlers never import `docClient`.
- Every write path must bump the version, which the helpers already do.
- `marshallOptions: { removeUndefinedValues: true }` is why `undefined` (not `null`) is
  the way to clear an optional field.
