/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { dynamoTable, projectBus, createStreamPipe, getStreamArnPrefix, stageResourceName, region, account, apiPermission, subscribeToBus } from "./_shared.infrastructure";

import { AWS_CONFIG } from "@env/config.env";

const CASHIER_TABLE = stageResourceName("BarOps-Cashier");
const SESSION_TABLE = stageResourceName("BarOps-Session");

const cashier = dynamoTable("BarOps-Cashier");
const env = { TABLE: cashier.name };

createStreamPipe("Cashier", cashier);

subscribeToBus("CashierSyncTipsRuleV2", {
  handler: "packages/functions/cashier/sync-tips/index.lambdaHandler",
  environment: { EVENT_BUS_NAME: projectBus.name },
  permissions: [
    { actions: ["events:PutEvents"], resources: [projectBus.nodes.bus.arn] },
  ],
}, {
  pattern: {
    detail: {
      eventSourceARN: [{ prefix: getStreamArnPrefix(CASHIER_TABLE) }],
      eventName: ["INSERT", "MODIFY", "REMOVE"],
      dynamodb: {
        Keys: {
          id: { S: [{ exists: true }] }
        }
      }
    }
  }
});

const cashierCreate = new sst.aws.Function("CashierCreate", {
  handler: "packages/functions/cashier/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [cashier.arn] },
    { actions: ["dynamodb:Query"], resources: [cashier.indexArn] },
  ],
});
apiPermission("CashierCreate", cashierCreate);

apiPermission("CashierGet", new sst.aws.Function("CashierGet", {
  handler: "packages/functions/cashier/get/index.handler",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [cashier.arn] },
    {
      actions: ["s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/receipts/*`],
    },
  ],
}));

apiPermission("CashierList", new sst.aws.Function("CashierList", {
  handler: "packages/functions/cashier/list/index.handler",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [cashier.arn, cashier.indexArn],
    },
    {
      actions: ["s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/receipts/*`],
    },
  ],
}));

const cashierPresign = new sst.aws.Function("CashierPresign", {
  handler: "packages/functions/cashier/presign/index.handler",
  memory: "512 MB",
  timeout: "30 seconds",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
    CASHIER_CREATE_LAMBDA_NAME: cashierCreate.name,
  },
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [cashier.arn] },
    { actions: ["dynamodb:Query"], resources: [cashier.indexArn] },
    {
      actions: ["s3:PutObject", "s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/z-reports/*`],
    },
    { actions: ["lambda:InvokeFunction"], resources: [cashierCreate.arn] },
  ],
});

apiPermission("CashierPresign", cashierPresign);

const cashierUnsign = new sst.aws.Function("CashierUnsign", {
  handler: "packages/functions/cashier/unsign/index.handler",
  memory: "512 MB",
  timeout: "30 seconds",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [cashier.arn] },
    {
      actions: ["s3:DeleteObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/receipts/*`],
    },
  ],
});

apiPermission("CashierUnsign", cashierUnsign);

apiPermission("CashierUpdate", new sst.aws.Function("CashierUpdate", {
  handler: "packages/functions/cashier/update/index.handler",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [cashier.arn] },
    {
      actions: ["s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/receipts/*`],
    },
  ],
}));

apiPermission("CashierDelete", new sst.aws.Function("CashierDelete", {
  handler: "packages/functions/cashier/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [cashier.arn] },
  ],
}));

subscribeToBus("CashierObserverRule", {
  handler: "packages/functions/cashier/observer/index.lambdaHandler",
  environment: {
    PARENT_TABLE: SESSION_TABLE,
    CHILD_TABLE: cashier.name,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [cashier.arn, cashier.indexArn],
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
 
