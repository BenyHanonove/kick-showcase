/// <reference path="../.sst/platform/config.d.ts" />
import { dynamoTable, projectBus, getStreamArnPrefix, stageResourceName, apiPermission, subscribeToBus } from "./_shared.infrastructure";

const CONSUME_TABLE = stageResourceName("BarOps-Consume");
const SESSION_TABLE = stageResourceName("BarOps-Session");

const consume = dynamoTable("BarOps-Consume");
const env = { TABLE: consume.name };

apiPermission("ConsumeCreate", new sst.aws.Function("ConsumeCreate", {
  handler: "packages/functions/consume/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [consume.arn] },
  ],
}));

apiPermission("ConsumeGet", new sst.aws.Function("ConsumeGet", {
  handler: "packages/functions/consume/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [consume.arn] },
  ],
}));

apiPermission("ConsumeList", new sst.aws.Function("ConsumeList", {
  handler: "packages/functions/consume/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [consume.arn, consume.indexArn],
    },
  ],
}));

apiPermission("ConsumeBatch", new sst.aws.Function("ConsumeBatch", {
  handler: "packages/functions/consume/batch/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query"],
      resources: [consume.arn, consume.indexArn],
    },
  ],
}));

apiPermission("ConsumeUpdate", new sst.aws.Function("ConsumeUpdate", {
  handler: "packages/functions/consume/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [consume.arn] },
  ],
}));

apiPermission("ConsumeDelete", new sst.aws.Function("ConsumeDelete", {
  handler: "packages/functions/consume/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [consume.arn] },
  ],
}));

subscribeToBus("ConsumeObserverRule", {
  handler: "packages/functions/consume/observer/index.lambdaHandler",
  environment: {
    PARENT_TABLE: SESSION_TABLE,
    CHILD_TABLE: consume.name,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [consume.arn, consume.indexArn],
    },
  ],
}, {
  pattern: {
    detail: {
      eventSourceARN: [{ prefix: getStreamArnPrefix(SESSION_TABLE) }],
      eventName: ["REMOVE"],
      dynamodb: {
        Keys: {
          id: { S: [{ exists: true }] }
        }
      }
    }
  }
});
