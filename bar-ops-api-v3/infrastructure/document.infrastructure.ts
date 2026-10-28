/// <reference path="../.sst/platform/config.d.ts" />
// Import external framework dependencies and status codes from third party packages
import { dynamoTable, getStreamArnPrefix, stageResourceName, apiPermission, subscribeToBus } from "./_shared.infrastructure";

// Import shared AWS services, guard security middleware, and utility helpers
import { AWS_CONFIG } from "@env/config.env";

const DOCUMENT_TABLE = stageResourceName("BarOps-Document");
const SESSION_TABLE = stageResourceName("BarOps-Session");

const document = dynamoTable(DOCUMENT_TABLE);
const env = { TABLE: document.name };

apiPermission("DocumentCreate", new sst.aws.Function("DocumentCreate", {
  handler: "packages/functions/document/create/index.handler",
  memory: "512 MB",
  timeout: "30 seconds",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [document.arn] },
    {
      actions: ["s3:PutObject", "s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/documents/*`],
    },
  ],
}));

apiPermission("DocumentList", new sst.aws.Function("DocumentList", {
  handler: "packages/functions/document/list/index.handler",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [document.arn, document.indexArn],
    },
    {
      actions: ["s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/documents/*`],
    },
  ],
}));

apiPermission("DocumentGet", new sst.aws.Function("DocumentGet", {
  handler: "packages/functions/document/get/index.handler",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [document.arn] },
    {
      actions: ["s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/documents/*`],
    },
  ],
}));

apiPermission("DocumentUpdate", new sst.aws.Function("DocumentUpdate", {
  handler: "packages/functions/document/update/index.handler",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [document.arn] },
    {
      actions: ["s3:GetObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/documents/*`],
    },
  ],
}));

apiPermission("DocumentDelete", new sst.aws.Function("DocumentDelete", {
  handler: "packages/functions/document/delete/index.handler",
  environment: {
    ...env,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:DeleteItem"], resources: [document.arn] },
    {
      actions: ["s3:DeleteObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/documents/*`],
    },
  ],
}));

// Automate DocumentObserver wiring via EventBridge subscription: cascade-delete configuration setting for
// a session's documents (DynamoDB rows + S3 files) when the
subscribeToBus("DocumentObserverRule", {
  handler: "packages/functions/document/observer/index.lambdaHandler",
  environment: {
    CHILD_TABLE: document.name,
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [document.arn, document.indexArn],
    },
    {
      actions: ["s3:DeleteObject"],
      resources: [$interpolate`arn:aws:s3:::${AWS_CONFIG.s3.globalBucket}/documents/*`],
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
