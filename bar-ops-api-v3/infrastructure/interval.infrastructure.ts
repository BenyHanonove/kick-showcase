/// <reference path="../.sst/platform/config.d.ts" />
import { dynamoTable, projectBus, createStreamPipe, getStreamArnPrefix, stageResourceName, apiPermission, subscribeToBus } from "./_shared.infrastructure";

const INTERVAL_TABLE = stageResourceName("BarOps-Interval");
const SHIFT_TABLE = stageResourceName("BarOps-Shift");

const interval = dynamoTable("BarOps-Interval");
const env = { TABLE: interval.name };

createStreamPipe("Interval", interval);

subscribeToBus("IntervalSyncShiftRule", {
  handler: "packages/functions/interval/sync-shift/index.lambdaHandler",
  environment: { EVENT_BUS_NAME: projectBus.name },
  permissions: [
    { actions: ["events:PutEvents"], resources: [projectBus.nodes.bus.arn] },
  ],
}, {
  pattern: {
    detail: {
      eventSourceARN: [{ prefix: getStreamArnPrefix(INTERVAL_TABLE) }],
      eventName: ["INSERT", "MODIFY", "REMOVE"],
      dynamodb: {
        Keys: {
          id: { S: [{ exists: true }] }
        }
      }
    }
  }
});

apiPermission("IntervalCreate", new sst.aws.Function("IntervalCreate", {
  handler: "packages/functions/interval/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [interval.arn] },
  ],
}));

apiPermission("IntervalGet", new sst.aws.Function("IntervalGet", {
  handler: "packages/functions/interval/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [interval.arn] },
  ],
}));

apiPermission("IntervalList", new sst.aws.Function("IntervalList", {
  handler: "packages/functions/interval/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [interval.arn, interval.indexArn],
    },
  ],
}));

apiPermission("IntervalUpdate", new sst.aws.Function("IntervalUpdate", {
  handler: "packages/functions/interval/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [interval.arn] },
  ],
}));

apiPermission("IntervalDelete", new sst.aws.Function("IntervalDelete", {
  handler: "packages/functions/interval/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [interval.arn] },
  ],
}));

subscribeToBus("IntervalObserverRule", {
  handler: "packages/functions/interval/observer/index.lambdaHandler",
  environment: {
    PARENT_TABLE: SHIFT_TABLE,
    CHILD_TABLE: interval.name,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [interval.arn, interval.indexArn],
    },
  ],
}, {
  pattern: {
    detail: {
      eventSourceARN: [{ prefix: getStreamArnPrefix(SHIFT_TABLE) }],
      eventName: ["REMOVE"],
      dynamodb: {
        Keys: {
          id: { S: [{ exists: true }] }
        }
      }
    }
  }
});
