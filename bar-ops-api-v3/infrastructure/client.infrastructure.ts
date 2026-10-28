/// <reference path="../.sst/platform/config.d.ts" />
import { dynamoTable, createStreamPipe, stageResourceName, apiPermission } from "./_shared.infrastructure";

const CLIENT_TABLE = stageResourceName("BarOps-Client");

const client = dynamoTable("BarOps-Client");
const env = { TABLE: client.name };

createStreamPipe("Client", client);

apiPermission("ClientCreate", new sst.aws.Function("ClientCreate", {
  handler: "packages/functions/client/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [client.arn] },
  ],
}));

apiPermission("ClientGet", new sst.aws.Function("ClientGet", {
  handler: "packages/functions/client/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [client.arn] },
  ],
}));

apiPermission("ClientList", new sst.aws.Function("ClientList", {
  handler: "packages/functions/client/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [client.arn, client.indexArn],
    },
  ],
}));

apiPermission("ClientUpdate", new sst.aws.Function("ClientUpdate", {
  handler: "packages/functions/client/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [client.arn] },
  ],
}));

apiPermission("ClientDelete", new sst.aws.Function("ClientDelete", {
  handler: "packages/functions/client/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [client.arn] },
  ],
}));
