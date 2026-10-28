/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { adoptOpts, flagEnv, importExisting, importIdFromEnv, importIds, optionalEnv } from "./_config.infrastructure";
import { cognito } from "./_cognito.infrastructure";
import { dynamoTable, streamTables } from "./_tables.infrastructure";
import { createDlq } from "./_alarms.infrastructure";

// WebSocket API: $connect / $disconnect / $default routes plus the broadcaster
// that fans table changes out to connected dashboards. Production adopts the
// console-created API via IMPORT_EXISTING=true + WEBSOCKET_API_ID.

const connections = dynamoTable("BarOps-WebSocketConnections");
const importedApiId = importIdFromEnv("WEBSOCKET_API_ID");
const stageName = optionalEnv("WEBSOCKET_STAGE_NAME") ?? $app.stage;
const manageRoutes = flagEnv("MANAGE_API_ROUTES", true);

export const websocketApi = new aws.apigatewayv2.Api(
  "WebSocketApi",
  {
    name: `${$app.name}-${$app.stage}-ws`,
    protocolType: "WEBSOCKET",
    routeSelectionExpression: "$request.body.action",
  },
  {
    ...adoptOpts(importedApiId),
    ...(importExisting ? { ignoreChanges: ["name", "description", "apiKeySelectionExpression"] } : {}),
  },
);

const websocketStage = new aws.apigatewayv2.Stage(
  "WebSocketStage",
  { apiId: websocketApi.id, name: stageName, autoDeploy: true },
  {
    ...adoptOpts(importedApiId && `${importedApiId}/${stageName}`),
    ...(importExisting ? { ignoreChanges: ["defaultRouteSettings", "routeSettings", "accessLogSettings", "description"] } : {}),
  },
);

// Management endpoint used by the broadcaster to push to connections
const websocketEndpoint = websocketStage.invokeUrl.apply((url) => url.replace(/^wss:/, "https:"));

const connectFn = new sst.aws.Function("SocketsConnect", {
  handler: "packages/functions/sockets/connect/index.handler",
  environment: {
    TABLE: connections.name,
    COGNITO_USER_POOL_ID: cognito.userPoolId,
    COGNITO_CLIENT_ID: cognito.clientId,
  },
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [connections.arn] },
  ],
});

const disconnectFn = new sst.aws.Function("SocketsDisconnect", {
  handler: "packages/functions/sockets/disconnect/index.handler",
  environment: {
    TABLE: connections.name,
  },
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [connections.arn] },
  ],
});

// Handles joinRoom/leaveRoom messages
const defaultFn = new sst.aws.Function("SocketsDefault", {
  handler: "packages/functions/sockets/default/index.handler",
  environment: {
    TABLE: connections.name,
  },
  permissions: [
    { actions: ["dynamodb:UpdateItem"], resources: [connections.arn] },
  ],
});

// $connect authenticates the token itself (it arrives as a subprotocol), so
// no route uses an API Gateway authorizer
const wsRoute = (name: string, routeKey: string, fn: sst.aws.Function) => {
  new aws.lambda.Permission(`${name}WsInvoke`, {
    statementId: "apigw-ws-invoke",
    action: "lambda:InvokeFunction",
    function: fn.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: $interpolate`${websocketApi.executionArn}/*/${routeKey}`,
  });

  if (!manageRoutes) return;

  const integrationId = importIds.wsIntegrations?.[routeKey];
  const integration = new aws.apigatewayv2.Integration(
    `${name}WsIntegration`,
    {
      apiId: websocketApi.id,
      integrationType: "AWS_PROXY",
      integrationUri: fn.arn,
    },
    {
      ...adoptOpts(importedApiId && integrationId && `${importedApiId}/${integrationId}`),
      ...(importExisting
        ? { ignoreChanges: ["integrationMethod", "timeoutMilliseconds", "description", "contentHandlingStrategy", "passthroughBehavior"] }
        : {}),
    },
  );

  const routeId = importIds.wsRoutes?.[routeKey];
  new aws.apigatewayv2.Route(
    `${name}WsRoute`,
    {
      apiId: websocketApi.id,
      routeKey,
      target: $interpolate`integrations/${integration.id}`,
    },
    adoptOpts(importedApiId && routeId ? `${importedApiId}/${routeId}` : undefined),
  );
};

wsRoute("SocketsConnect", "$connect", connectFn);
wsRoute("SocketsDisconnect", "$disconnect", disconnectFn);
wsRoute("SocketsDefault", "$default", defaultFn);

// Broadcaster: reads every streamed table directly (event source mappings)
const broadcastTables = streamTables().map((baseName) => ({ baseName, table: dynamoTable(baseName) }));

// Batches that keep failing are bisected to isolate the bad record, then the
// record metadata goes to this DLQ instead of blocking the shard
const broadcasterDlq = createDlq("SocketsBroadcaster");

const broadcaster = new sst.aws.Function("SocketsBroadcaster", {
  handler: "packages/functions/sockets/broadcaster/index.handler",
  environment: {
    TABLE: connections.name,
    WEBSOCKET_ENDPOINT: websocketEndpoint,
  },
  permissions: [
    {
      actions: ["dynamodb:Scan", "dynamodb:DeleteItem"],
      resources: [connections.arn],
    },
    {
      actions: [
        "dynamodb:DescribeStream",
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:ListStreams",
      ],
      resources: broadcastTables.map(({ table }) => table.streamArn),
    },
    {
      actions: ["execute-api:ManageConnections"],
      resources: [$interpolate`${websocketApi.executionArn}/${stageName}/POST/@connections/*`],
    },
    { actions: ["sqs:SendMessage"], resources: [broadcasterDlq.arn] },
  ],
});

for (const { baseName, table } of broadcastTables) {
  const key = baseName.replace(/[^A-Za-z0-9]/g, "");
  new aws.lambda.EventSourceMapping(
    `SocketsBroadcaster${key}Mapping`,
    {
      functionName: broadcaster.name,
      eventSourceArn: table.streamArn,
      startingPosition: "LATEST",
      batchSize: 100,
      maximumRetryAttempts: 3,
      maximumRecordAgeInSeconds: 60 * 60,
      bisectBatchOnFunctionError: true,
      destinationConfig: { onFailure: { destinationArn: broadcasterDlq.arn } },
    },
    {
      // Console-created mappings are adopted when their UUID is listed in
      // IMPORT_IDS_FILE (broadcasterMappings, keyed by base table name)
      ...adoptOpts(importIds.broadcasterMappings?.[baseName]),
      ...(importExisting ? { ignoreChanges: ["batchSize", "maximumBatchingWindowInSeconds"] } : {}),
    },
  );
}
