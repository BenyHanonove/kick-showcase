# Layer 6 — Events, observers & websockets

**Files:** [`packages/shared/aws/eventbridge/`](../../bar-ops-api-v3/packages/shared/aws/eventbridge/) ·
`packages/functions/<resource>/observer/index.ts` ·
[`packages/functions/sockets/`](../../bar-ops-api-v3/packages/functions/sockets/) ·
[`infrastructure/websocket.infrastructure.ts`](../../bar-ops-api-v3/infrastructure/websocket.infrastructure.ts)

## The async spine

```
DynamoDB table (stream: NEW_AND_OLD_IMAGES)
   └─ EventBridge Pipe            createStreamPipe("Consume", table)
        └─ project bus            bar-ops-api-v3-<stage>-bus
             ├─ observer lambdas  cascade deletes, denormalized rollups, notifications
             └─ SocketsBroadcaster→ live push to connected dashboards
```

Nothing in a request path waits for this. A handler returns as soon as the row is
written; consequences happen on the bus.

## Writing an observer

```ts
export const lambdaHandler = wrapDynamoStreamHandler<SessionDto>(async (record) => {
  if (record.eventName !== 'REMOVE') return;
  await cascadeDeleteByField(process.env.CHILD_TABLE!, 'SessionIdIndex', 'sessionId', record.keys.id);
});
```

`wrapDynamoStreamHandler` unmarshalls `Keys` / `NewImage` / `OldImage` into plain
objects and gives you `eventName` (`INSERT` | `MODIFY` | `REMOVE`). It also **filters by
source table** using `PARENT_TABLE` (or an explicit ARN substring) — one bus carries
every table's stream, so an unfiltered observer would react to unrelated writes.

`wrapCustomEventHandler` does the same for events you publish yourself with
`publishEvent({ source, detailType, detail })`.

Wire it in the resource's `*.infrastructure.ts` with `subscribeToBus(...)`, and give the
observer only the IAM its side effect needs.

## WebSockets

Four Lambdas, one console-created WebSocket API per stage:

| Function | Trigger | Job |
| --- | --- | --- |
| `SocketsConnect` | `$connect` | validate the Cognito token, store the connection id |
| `SocketsDisconnect` | `$disconnect` | delete the connection row |
| `SocketsDefault` | `$default` | handle `joinRoom` / `leaveRoom` messages |
| `SocketsBroadcaster` | bus / stream | fan out to connections, delete stale ones |

**Rooms** are how the dashboard subscribes to one session or sale: the frontend router
calls `WebSocketStore().setRoom(id)` on `/sessions/:id` and `/sales/:id`, which sends a
`joinRoom` message; the broadcaster only pushes a row's change to that room. Adding a
new live screen is a room join on the frontend plus a broadcaster case — no new socket
infrastructure.

## When to reach for this layer

| Need | Mechanism |
| --- | --- |
| Delete children with the parent | observer + `cascadeDeleteByField` |
| Keep a denormalized total in sync | observer on the child table |
| Notify (WhatsApp/email) after a write | observer + the WhatsApp/SES utils |
| Live-update an open dashboard | broadcaster + room |
| Anything the user must see in the response | **not here** — do it in the handler |
