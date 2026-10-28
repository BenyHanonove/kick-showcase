/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { dynamoTable, createStreamPipe, stageResourceName, lambdaName, region, account, FONTS_PREFIX, apiPermission } from "./_shared.infrastructure";

import { AWS_CONFIG } from "@env/config.env";

const SUPPLIER_TABLE = stageResourceName("BarOps-Supplier");
const PRODUCT_TABLE = stageResourceName("BarOps-Product");

const supplier = dynamoTable(SUPPLIER_TABLE);
const env = { TABLE: supplier.name, PRODUCTTABLE: PRODUCT_TABLE };

createStreamPipe("Supplier", supplier);

apiPermission("SupplierCreate", new sst.aws.Function("SupplierCreate", {
  handler: "packages/functions/supplier/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [supplier.arn] },
  ],
}));

apiPermission("SupplierGet", new sst.aws.Function("SupplierGet", {
  handler: "packages/functions/supplier/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [supplier.arn] },
  ],
}));

apiPermission("SupplierList", new sst.aws.Function("SupplierList", {
  handler: "packages/functions/supplier/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [supplier.arn, supplier.indexArn],
    },
  ],
}));

apiPermission("SupplierUpdate", new sst.aws.Function("SupplierUpdate", {
  handler: "packages/functions/supplier/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [supplier.arn] },
  ],
}));

apiPermission("SupplierDelete", new sst.aws.Function("SupplierDelete", {
  handler: "packages/functions/supplier/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [supplier.arn] },
  ],
}));

const supplierSummary = new sst.aws.Function("SupplierSummary", {
  handler: "packages/functions/supplier/summary/index.handler",
  memory: "512 MB",
  timeout: "30 seconds",
  environment: {
    ...env,
    SESSION_LAMBDA_NAME: lambdaName("session", "list"),
    SALE_LAMBDA_NAME: lambdaName("sale", "list"),
    CONSUME_BATCH_LAMBDA_NAME: lambdaName("consume", "batch"),
    PRODUCT_LAMBDA_NAME: lambdaName("product", "list"),
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
    FONTS_PREFIX,
  },
  permissions: [
    { actions: ["lambda:InvokeFunction"], resources: ["*"] },
    { actions: ["dynamodb:GetItem"], resources: [supplier.arn] },
    {
      actions: ["s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/*`],
    },
  ],
  nodejs: {
    install: ["pdf-lib"],
  },
});

apiPermission("SupplierSummary", supplierSummary, "*/*/supplier/summary/*");
