/// <reference path="../.sst/platform/config.d.ts" />
// Import external framework dependencies and status codes from third party packages
import { stageResourceName, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, WEBSOCKET_ENDPOINT } from "./_shared.infrastructure";

const WEBSOCKET_CONNECTIONS_TABLE = stageResourceName("BarOps-WebSocketConnections");

new sst.aws.Function("SocketsConnect", {
  handler: "packages/functions/sockets/connect/index.handler",
  environment: {
    TABLE: WEBSOCKET_CONNECTIONS_TABLE,
    COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID,
  },
  permissions: [
    {
      actions: ["dynamodb:PutItem"],
      resources: [`arn:aws:dynamodb:*:*:table/${WEBSOCKET_CONNECTIONS_TABLE}`],
    },
  ],
});

new sst.aws.Function("SocketsDisconnect", {
  handler: "packages/functions/sockets/disconnect/index.handler",
  environment: {
    TABLE: WEBSOCKET_CONNECTIONS_TABLE,
  },
  permissions: [
    {
      actions: ["dynamodb:DeleteItem"],
      resources: [`arn:aws:dynamodb:*:*:table/${WEBSOCKET_CONNECTIONS_TABLE}`],
    },
  ],
});

// Sockets Default Fallback Lambda Function (handles joinRoom/leaveRoom messages)
new sst.aws.Function("SocketsDefault", {
  handler: "packages/functions/sockets/default/index.handler",
  environment: {
    TABLE: WEBSOCKET_CONNECTIONS_TABLE,
  },
  permissions: [
    {
      actions: ["dynamodb:UpdateItem"],
      resources: [`arn:aws:dynamodb:*:*:table/${WEBSOCKET_CONNECTIONS_TABLE}`],
    },
  ],
});

// Sockets Broadcaster Lambda Function (triggered manually by DynamoDB streams)
new sst.aws.Function("SocketsBroadcaster", {
  handler: "packages/functions/sockets/broadcaster/index.handler",
  environment: {
    TABLE: WEBSOCKET_CONNECTIONS_TABLE,
    WEBSOCKET_ENDPOINT,
  },
  permissions: [
    {
      actions: [
        "dynamodb:Scan",
        "dynamodb:DeleteItem"
      ],
      resources: [`arn:aws:dynamodb:*:*:table/${WEBSOCKET_CONNECTIONS_TABLE}`],
    },
    {
      actions: [
        "dynamodb:DescribeStream",
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:ListStreams",
      ],
      resources: ["arn:aws:dynamodb:*:*:table/*/stream/*"],
    },
    {
      actions: ["execute-api:ManageConnections"],
      resources: ["*"],
    },
  ],
});

export {};
