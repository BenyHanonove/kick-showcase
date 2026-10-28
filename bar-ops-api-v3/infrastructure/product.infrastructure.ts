/// <reference path="../.sst/platform/config.d.ts" />
import { dynamoTable, projectBus, getStreamArnPrefix, stageResourceName, apiPermission, subscribeToBus } from "./_shared.infrastructure";

const PRODUCT_TABLE = stageResourceName("BarOps-Product");
const SUPPLIER_TABLE = stageResourceName("BarOps-Supplier");

const product = dynamoTable(PRODUCT_TABLE);
const env = { TABLE: product.name };

apiPermission("ProductCreate", new sst.aws.Function("ProductCreate", {
  handler: "packages/functions/product/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [product.arn] },
  ],
}));

apiPermission("ProductGet", new sst.aws.Function("ProductGet", {
  handler: "packages/functions/product/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [product.arn] },
  ],
}));

apiPermission("ProductList", new sst.aws.Function("ProductList", {
  handler: "packages/functions/product/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [product.arn, product.indexArn],
    },
  ],
}));

apiPermission("ProductUpdate", new sst.aws.Function("ProductUpdate", {
  handler: "packages/functions/product/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [product.arn] },
  ],
}));

apiPermission("ProductDelete", new sst.aws.Function("ProductDelete", {
  handler: "packages/functions/product/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [product.arn] },
  ],
}));

subscribeToBus("ProductObserverRule", {
  handler: "packages/functions/product/observer/index.lambdaHandler",
  environment: {
    PARENT_TABLE: SUPPLIER_TABLE,
    CHILD_TABLE: product.name,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [product.arn, product.indexArn],
    },
  ],
}, {
  pattern: {
    detail: {
      eventSourceARN: [{ prefix: getStreamArnPrefix(SUPPLIER_TABLE) }],
      eventName: ["REMOVE"],
      dynamodb: {
        Keys: {
          id: { S: [{ exists: true }] }
        }
      }
    }
  }
});
