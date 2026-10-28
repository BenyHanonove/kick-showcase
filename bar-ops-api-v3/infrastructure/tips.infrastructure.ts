/// <reference path="../.sst/platform/config.d.ts" />
import { dynamoTable, projectBus, getStreamArnPrefix, stageResourceName, apiPermission, subscribeToBus } from "./_shared.infrastructure";

const TIPS_TABLE = stageResourceName("BarOps-Tips");
const SESSION_TABLE = stageResourceName("BarOps-Session");

const tips = dynamoTable("BarOps-Tips");
const env = { TABLE: tips.name };

subscribeToBus("TipsSyncCashier", {
  handler: "packages/functions/tips/sync-cashier/index.lambdaHandler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:Query", "dynamodb:UpdateItem"], resources: [tips.arn, tips.indexArn] },
  ],
}, {
  pattern: {
    source: ["cashier.sync"],
    detailType: ["CashierSync"]
  }
});

apiPermission("TipsCreate", new sst.aws.Function("TipsCreate", {
  handler: "packages/functions/tips/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [tips.arn] },
  ],
}));

apiPermission("TipsGet", new sst.aws.Function("TipsGet", {
  handler: "packages/functions/tips/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [tips.arn] },
  ],
}));

apiPermission("TipsList", new sst.aws.Function("TipsList", {
  handler: "packages/functions/tips/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [tips.arn, tips.indexArn],
    },
  ],
}));

apiPermission("TipsUpdate", new sst.aws.Function("TipsUpdate", {
  handler: "packages/functions/tips/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [tips.arn] },
  ],
}));

apiPermission("TipsDelete", new sst.aws.Function("TipsDelete", {
  handler: "packages/functions/tips/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [tips.arn] },
  ],
}));

subscribeToBus("TipsObserverRule", {
  handler: "packages/functions/tips/observer/index.lambdaHandler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [tips.arn, tips.indexArn],
    },
  ],
}, {
  pattern: {
    detail: {
      eventSourceARN: [{ prefix: getStreamArnPrefix(SESSION_TABLE) }],
      eventName: ["INSERT", "REMOVE"],
      dynamodb: {
        Keys: {
          id: { S: [{ exists: true }] }
        }
      }
    }
  }
});
