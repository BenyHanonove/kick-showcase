# Layer 4 — DTOs & validation

**Files:** `packages/shared/dtos/<resource>/{create,update,<resource>}.dto.ts` ·
[`utils/request/request.util.ts`](../../bar-ops-api-v3/packages/shared/utils/request/request.util.ts)

DTOs are `class-validator` classes. They are the **contract** — validated on the way in
*and* on the way out of DynamoDB, and mirrored by the frontend `I*` interfaces.

## The three-class rule

| Class | Role | Shape |
| --- | --- | --- |
| `Create<X>Dto` | write contract | required fields, no `id`, no `timestamp` |
| `Update<X>Dto` | patch contract | every field `@IsOptional()`, **plus `@IsDateString() timestamp!`** |
| `<X>Dto` | read contract | `extends Create<X>Dto` + `@IsUUID() id!` + `@IsDateString() timestamp!` |

`timestamp` on the update DTO is not decoration — it is the optimistic-concurrency
token. Drop it and concurrent edits silently overwrite each other.

## Common decorator idioms

```ts
@IsString() @Length(2, 100) name!: string;
@IsOptional() @Transform(({ value }) => (value === "" ? undefined : value)) @IsEmail() email?: string;
@IsString() @Length(9, 15) phone!: string;
```

The `Transform` on optional fields matters: the dashboard sends `""` for an untouched
input, and `@IsEmail()` would reject it. Converting `""` → `undefined` lets
`removeUndefinedValues` drop the attribute entirely.

## Entry points

| Helper | Use |
| --- | --- |
| `validateBody(event, Dto, message)` | Parse + validate the HTTP body → `{data}` or `{error}` (a ready 400 response) |
| `validateInstance(obj, Dto, message)` | Same, for objects you assembled yourself |
| `extractId(event, 'id', message)` | Path parameter or a ready 400 |
| `extractQueryParam(event, name, message)` | Query string or a ready 400 |

All use `plainToInstance(..., { enableImplicitConversion: true })` and
`validate(..., { whitelist: true })` — unknown properties are stripped, so a client
cannot inject extra attributes into the table.

## Round-trip validation

The Dynamo helpers validate the DTO again after reading/writing. A schema drift
(a field added in the console, a legacy row missing a now-required field) surfaces as a
thrown validation error → `400` with the `errors` array, not a corrupt response.

## Keeping the frontend in sync

`ICreate<X>` / `IUpdate<X>` / `I<X>` in
`bar-ops-dashboard/src/modules/<x>/types/` must match these classes field for field,
including optionality and including `timestamp` on the update interface. See
[../frontend/03-types.md](../frontend/03-types.md).
