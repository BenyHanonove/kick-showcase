/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { dynamoTable, projectBus, createStreamPipe, getStreamArnPrefix, stageResourceName, lambdaName, region, account, FONTS_PREFIX, PDF_TEMPLATE_KEY, apiPermission, subscribeToBus, lambdaArn } from "./_shared.infrastructure";

import { AWS_CONFIG } from "@env/config.env";

const SESSION_TABLE = stageResourceName("BarOps-Session");
const CLIENT_TABLE = stageResourceName("BarOps-Client");

const session = dynamoTable("BarOps-Session");
const env = { TABLE: session.name };

createStreamPipe("Session", session);

apiPermission("SessionCreate", new sst.aws.Function("SessionCreate", {
  handler: "packages/functions/session/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [session.arn] },
  ],
}));

apiPermission("SessionGet", new sst.aws.Function("SessionGet", {
  handler: "packages/functions/session/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [session.arn] },
  ],
}));

apiPermission("SessionList", new sst.aws.Function("SessionList", {
  handler: "packages/functions/session/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [session.arn, session.indexArn],
    },
  ],
}));

apiPermission("SessionUpdate", new sst.aws.Function("SessionUpdate", {
  handler: "packages/functions/session/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [session.arn] },
  ],
}));

apiPermission("SessionDelete", new sst.aws.Function("SessionDelete", {
  handler: "packages/functions/session/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [session.arn] },
  ],
}));

const sessionSummary = new sst.aws.Function("SessionSummary", {
  handler: "packages/functions/session/summary/index.lambdaHandler",
  memory: "512 MB",
  timeout: "30 seconds",
  environment: {
    ...env,
    SESSION_LAMBDA_NAME: lambdaName("session", "get"),
    CLIENT_LAMBDA_NAME: lambdaName("client", "get"),
    CASHIER_LAMBDA_NAME: lambdaName("cashier", "list"),
    CONSUME_LAMBDA_NAME: lambdaName("consume", "list"),
    EXPENSE_LAMBDA_NAME: lambdaName("expense", "list"),
    PRODUCT_LAMBDA_NAME: lambdaName("product", "list"),
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
    FONTS_PREFIX,
    PDF_TEMPLATE_KEY,
  },
  permissions: [
    {
      actions: ["lambda:InvokeFunction"],
      resources: [
        lambdaArn("session", "get"),
        lambdaArn("client", "get"),
        lambdaArn("cashier", "list"),
        lambdaArn("consume", "list"),
        lambdaArn("expense", "list"),
        lambdaArn("product", "list"),
      ],
    },
    // Fonts and PDF template only
    {
      actions: ["s3:GetObject"],
      resources: [
        $interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/${FONTS_PREFIX}/*`,
        $interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/pdf/*`,
      ],
    },
    // ListBucket turns a missing asset into NoSuchKey instead of AccessDenied
    {
      actions: ["s3:ListBucket"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}`],
    },
  ],
  nodejs: {
    install: ["pdf-lib"],
  },
});

apiPermission("SessionSummary", sessionSummary);

subscribeToBus("SessionObserverRule", {
  handler: "packages/functions/session/observer/index.lambdaHandler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [session.arn, session.indexArn],
    },
  ],
}, {
  pattern: {
    detail: {
      eventSourceARN: [{ prefix: getStreamArnPrefix(CLIENT_TABLE) }],
      eventName: ["REMOVE"],
      dynamodb: {
        Keys: {
          id: { S: [{ exists: true }] }
        }
      }
    }
  }
});
