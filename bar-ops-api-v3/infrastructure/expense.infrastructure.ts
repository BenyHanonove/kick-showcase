/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { dynamoTable, projectBus, getStreamArnPrefix, stageResourceName, region, account, apiPermission, subscribeToBus } from "./_shared.infrastructure";

import { AWS_CONFIG } from "@env/config.env";

const EXPENSE_TABLE = stageResourceName("BarOps-Expense");
const SESSION_TABLE = stageResourceName("BarOps-Session");

const expense = dynamoTable("BarOps-Expense");
const env = { TABLE: expense.name };

apiPermission("ExpenseCreate", new sst.aws.Function("ExpenseCreate", {
  handler: "packages/functions/expense/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [expense.arn] },
  ],
}));

apiPermission("ExpenseGet", new sst.aws.Function("ExpenseGet", {
  handler: "packages/functions/expense/get/index.handler",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [expense.arn] },
    {
      actions: ["s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/expenses/*`],
    },
  ],
}));

apiPermission("ExpenseList", new sst.aws.Function("ExpenseList", {
  handler: "packages/functions/expense/list/index.handler",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [expense.arn, expense.indexArn],
    },
    {
      actions: ["s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/expenses/*`],
    },
  ],
}));

const expensePresign = new sst.aws.Function("ExpensePresign", {
  handler: "packages/functions/expense/presign/index.handler",
  memory: "512 MB",
  timeout: "30 seconds",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [expense.arn] },
    {
      actions: ["s3:PutObject", "s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/expenses/*`],
    },
  ],
});

apiPermission("ExpensePresign", expensePresign);

const expenseUnsign = new sst.aws.Function("ExpenseUnsign", {
  handler: "packages/functions/expense/unsign/index.handler",
  memory: "512 MB",
  timeout: "30 seconds",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [expense.arn] },
    {
      actions: ["s3:DeleteObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/expenses/*`],
    },
  ],
});

apiPermission("ExpenseUnsign", expenseUnsign);

apiPermission("ExpenseUpdate", new sst.aws.Function("ExpenseUpdate", {
  handler: "packages/functions/expense/update/index.handler",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [expense.arn] },
    {
      actions: ["s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/expenses/*`],
    },
  ],
}));

apiPermission("ExpenseDelete", new sst.aws.Function("ExpenseDelete", {
  handler: "packages/functions/expense/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [expense.arn] },
  ],
}));

subscribeToBus("ExpenseObserverRule", {
  handler: "packages/functions/expense/observer/index.lambdaHandler",
  environment: {
    PARENT_TABLE: SESSION_TABLE,
    CHILD_TABLE: expense.name,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [expense.arn, expense.indexArn],
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
