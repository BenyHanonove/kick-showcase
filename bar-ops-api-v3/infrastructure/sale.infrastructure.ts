/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { dynamoTable, projectBus, createStreamPipe, getStreamArnPrefix, stageResourceName, lambdaName, region, account, FONTS_PREFIX, apiPermission, subscribeToBus } from "./_shared.infrastructure";

import { AWS_CONFIG } from "@env/config.env";

const SALE_TABLE = stageResourceName("BarOps-Sale");
const CONSUME_TABLE = stageResourceName("BarOps-Consume");
const CLIENT_TABLE = stageResourceName("BarOps-Client");

const sale = dynamoTable(SALE_TABLE);
const env = { TABLE: sale.name };

// Build consume ARNs directly to avoid a duplicate Pulumi resource
const consumeArn = $interpolate`arn:aws:dynamodb:${region}:${account}:table/${CONSUME_TABLE}`;
const consumeIndexArn = $interpolate`${consumeArn}/index/*`;

createStreamPipe("Sale", sale);

apiPermission("SaleCreate", new sst.aws.Function("SaleCreate", {
  handler: "packages/functions/sale/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [sale.arn] },
  ],
}));

apiPermission("SaleGet", new sst.aws.Function("SaleGet", {
  handler: "packages/functions/sale/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [sale.arn] },
  ],
}));

apiPermission("SaleList", new sst.aws.Function("SaleList", {
  handler: "packages/functions/sale/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [sale.arn, sale.indexArn],
    },
  ],
}));

apiPermission("SaleUpdate", new sst.aws.Function("SaleUpdate", {
  handler: "packages/functions/sale/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [sale.arn] },
  ],
}));

apiPermission("SaleDelete", new sst.aws.Function("SaleDelete", {
  handler: "packages/functions/sale/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [sale.arn] },
  ],
}));

const saleSummary = new sst.aws.Function("SaleSummary", {
  handler: "packages/functions/sale/summary/index.lambdaHandler",
  memory: "512 MB",
  timeout: "30 seconds",
  environment: {
    ...env,
    SALE_LAMBDA_NAME: lambdaName("sale", "get"),
    CLIENT_LAMBDA_NAME: lambdaName("client", "get"),
    CONSUME_LAMBDA_NAME: lambdaName("consume", "list"),
    PRODUCT_LAMBDA_NAME: lambdaName("product", "list"),
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
    FONTS_PREFIX,
    PDF_TEMPLATE_KEY: "pdf/Kick_A4.pdf",
  },
  permissions: [
    { actions: ["lambda:InvokeFunction"], resources: ["*"] },
    {
      actions: ["s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/*`],
    },
    {
      actions: ["s3:ListBucket"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}`],
    },
  ],
  nodejs: {
    install: ["pdf-lib"],
  },
});

apiPermission("SaleSummary", saleSummary, "*/*/sale/summary/*");

apiPermission("SaleSummaryByMonth", new sst.aws.Function("SaleSummaryByMonth", {
  handler: "packages/functions/sale/summary-by-month/index.lambdaHandler",
  environment: {
    SALE_LAMBDA_NAME: lambdaName("sale", "list"),
    CONSUME_LAMBDA_NAME: lambdaName("consume", "list"),
  },
  permissions: [
    { actions: ["lambda:InvokeFunction"], resources: ["*"] },
  ],
}));

// Cascades: client delete removes sales, sale delete removes consumes
subscribeToBus("SaleObserverRule", {
  handler: "packages/functions/sale/observer/index.lambdaHandler",
  environment: {
    TABLE: sale.name,
    CHILD_TABLE: CONSUME_TABLE,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [sale.arn, sale.indexArn],
    },
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [consumeArn, consumeIndexArn],
    },
  ],
}, {
  pattern: {
    detail: {
      eventSourceARN: [
        { prefix: getStreamArnPrefix(SALE_TABLE) },
        { prefix: getStreamArnPrefix(CLIENT_TABLE) }
      ],
      eventName: ["REMOVE"],
      dynamodb: {
        Keys: {
          id: { S: [{ exists: true }] }
        }
      }
    }
  }
});
