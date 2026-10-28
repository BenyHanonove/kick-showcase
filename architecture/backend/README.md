# Backend — `bar-ops-api-v3`

TypeScript serverless API on AWS: **SST v4 (Pulumi)** deploys one Lambda per action
behind a manually-created **HTTP API Gateway**, with **DynamoDB** for storage,
**Redis** for read caching, **Cognito** for identity, and **DynamoDB Streams →
EventBridge Pipes** for background work.

## Layers

Read them in this order — it is also the order data flows through a request.

| # | Layer | Doc | Lives in |
| --- | --- | --- | --- |
| 1 | Infrastructure & stages | [01-infrastructure.md](01-infrastructure.md) | `sst.config.ts`, `infrastructure/` |
| 2 | Handlers (one Lambda per action) | [02-handlers.md](02-handlers.md) | `packages/functions/<resource>/<action>/` |
| 3 | Guards & identity | [03-guards.md](03-guards.md) | `packages/shared/guards/` |
| 4 | DTOs & validation | [04-dtos-validation.md](04-dtos-validation.md) | `packages/shared/dtos/` |
| 5 | Data access (Dynamo + Redis + OCC) | [05-data-access.md](05-data-access.md) | `packages/shared/aws/dynamo/`, `aws/redis/` |
| 6 | Events, observers & websockets | [06-events-observers.md](06-events-observers.md) | `packages/shared/aws/eventbridge/`, `functions/*/observer/`, `functions/sockets/` |
| 7 | Shared utils & messages | [07-utils-messages.md](07-utils-messages.md) | `packages/shared/utils/` |
| 8 | Testing & deployment | [08-testing-deploy.md](08-testing-deploy.md) | `packages/testing/` |

## Golden path — add a new resource end to end

Worked example: a resource called **`vendorNote`**. Copy [`client`](../../bar-ops-api-v3/packages/functions/client/)
— it is the smallest complete resource in the repo.

### Step 1 — Create the DynamoDB table (console, both stages)

| Stage | Table name |
| --- | --- |
| production | `BarOps-VendorNote` |
| dev | `dev-BarOps-VendorNote` |

Partition key `id` (String), no sort key. Turn on **DynamoDB Streams (new and old
image)** only if you need observers/cascades. Add GSIs now if you will query by a
foreign key (`<Field>Index`, e.g. `SessionIdIndex`).

> Tables are **not** created by the IaC — `stageResourceName()` just prefixes `dev-`
> and `dynamoTable()` looks the table up. Deploying before the table exists fails.

### Step 2 — Write the DTOs

`packages/shared/dtos/vendor-note/`:

```ts
// create.dto.ts — the write contract
export class CreateVendorNoteDto {
  @IsString() @Length(2, 100) title!: string;
  @IsOptional() @IsString() body?: string;
}

// update.dto.ts — every field optional EXCEPT timestamp (optimistic concurrency)
export class UpdateVendorNoteDto {
  @IsOptional() @IsString() @Length(2, 100) title?: string;
  @IsOptional() @IsString() body?: string;
  @IsDateString() timestamp!: string;
}

// vendor-note.dto.ts — the read contract = create + server-owned fields
export class VendorNoteDto extends CreateVendorNoteDto {
  @IsUUID() id!: string;
  @IsDateString() timestamp!: string;
}
```

Details and pitfalls: [04-dtos-validation.md](04-dtos-validation.md).

### Step 3 — Write the handlers

One folder per action under `packages/functions/vendor-note/`:
`create/`, `get/`, `list/`, `update/`, `delete/` — each with `index.ts` exporting
`handler`. Copy the client handlers verbatim and change the DTO + Hebrew nouns:

```ts
const MESSAGES = new ResourceMessages('הערת ספק', 'הערות ספק');

export const handler = RolesGuard([UserRole.ADMIN], async (event) => {
  try {
    const { data: body, error } = await validateBody(event, CreateVendorNoteDto, MESSAGES.ERROR.VALIDATION_FAILED);
    if (error) return error;
    const instance = await create(process.env.TABLE!, body, VendorNoteDto);
    return { statusCode: StatusCodes.CREATED, body: JSON.stringify({ message: MESSAGES.SUCCESS.CREATED, data: instance }) };
  } catch (err) {
    logger.error(err);
    return { statusCode: StatusCodes.INTERNAL_SERVER_ERROR, body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }) };
  }
});
```

Handler anatomy, status codes, and the `events.json` convention: [02-handlers.md](02-handlers.md).

### Step 4 — Declare the infrastructure

`infrastructure/vendor-note.infrastructure.ts`, copied from
[`client.infrastructure.ts`](../../bar-ops-api-v3/infrastructure/client.infrastructure.ts):

```ts
const VENDOR_NOTE_TABLE = stageResourceName("BarOps-VendorNote");
const vendorNote = dynamoTable(VENDOR_NOTE_TABLE);
const env = { TABLE: vendorNote.name };

createStreamPipe("VendorNote", vendorNote);   // only if the table has a stream

apiPermission("VendorNoteCreate", new sst.aws.Function("VendorNoteCreate", {
  handler: "packages/functions/vendor-note/create/index.handler",
  environment: env,
  permissions: [{ actions: ["dynamodb:PutItem"], resources: [vendorNote.arn] }],
}));
// …Get / List / Update / Delete, each with only the IAM actions it needs
```

IAM per action is deliberate — see the table in [01-infrastructure.md](01-infrastructure.md).

### Step 5 — Register it in `sst.config.ts`

Add one line to `run()`, alphabetically:

```ts
await import("./infrastructure/vendor-note.infrastructure");
```

Lambda names are derived automatically from the handler path:
`bar-ops-api-v3-<stage>-vendor-note-create`.

### Step 6 — Deploy to dev

```bash
cd bar-ops-api-v3
npx sst deploy --stage dev
```

### Step 7 — Wire the API Gateway routes (console, per stage)

The IaC only grants `apigateway.amazonaws.com` permission to invoke the functions —
**routes are created by hand** in each stage's HTTP API (`<HTTP_API_ID>` from `.env.<stage>`):

| Route | Integration (Lambda) | Authorizer |
| --- | --- | --- |
| `POST /vendor-note` | `…-vendor-note-create` | JWT (Cognito) |
| `GET /vendor-note` | `…-vendor-note-list` | JWT |
| `GET /vendor-note/{id}` | `…-vendor-note-get` | JWT |
| `PUT /vendor-note/{id}` | `…-vendor-note-update` | JWT |
| `DELETE /vendor-note/{id}` | `…-vendor-note-delete` | JWT |

Use payload format **2.0**. Leave the authorizer off only for genuinely public routes
(`/auth/*`, self-registration links).

### Step 8 — Write the API tests

- `packages/testing/endpoints/vendor-note/{create,get,list,update,delete}.js` — thin
  axios wrappers.
- `packages/testing/lifecycles/vendor-note.js` — the role matrix: what ADMIN can do,
  what MANAGER gets 403 on, what USER gets 403 on, plus a full create→get→list→
  update→delete cycle. Copy [`lifecycles/client.js`](../../bar-ops-api-v3/packages/testing/lifecycles/client.js).

### Step 9 — Ship

```bash
npm run test:dev        # all lifecycles, all three roles, against dev
npm run deploy:barops   # deploy dev → run every test → deploy production
```

`deploy:barops` aborts before touching production if anything fails.
See [08-testing-deploy.md](08-testing-deploy.md).

### Step 10 — Frontend

Continue in [../frontend/README.md](../frontend/README.md) — the `I*` interfaces there
must mirror the DTOs you wrote in step 2.

## Checklist

- [ ] Table (+ GSIs, + stream if needed) created in **both** stages
- [ ] `create.dto.ts` / `update.dto.ts` (with `timestamp!`) / `<resource>.dto.ts`
- [ ] One folder per action, each wrapped in `RolesGuard`
- [ ] Hebrew `ResourceMessages` with correct singular/plural
- [ ] `*.infrastructure.ts` with least-privilege IAM per action
- [ ] Imported in `sst.config.ts`
- [ ] Routes wired in the API Gateway console for dev **and** production
- [ ] `endpoints/` wrappers + `lifecycles/` role matrix test
- [ ] `npm run deploy:barops` green
