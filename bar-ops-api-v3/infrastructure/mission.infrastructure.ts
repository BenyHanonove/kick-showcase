/// <reference path="../.sst/platform/config.d.ts" />
import { dynamoTable, projectBus, createStreamPipe, getStreamArnPrefix, stageResourceName, lambdaName, apiPermission, subscribeToBus } from "./_shared.infrastructure";

const MISSION_TABLE = stageResourceName("BarOps-Mission");
const SESSION_TABLE = stageResourceName("BarOps-Session");

const mission = dynamoTable("BarOps-Mission");
const env = { TABLE: mission.name };

// Streams not enabled on BarOps-Mission table, pipe omitted

apiPermission("MissionCreate", new sst.aws.Function("MissionCreate", {
  handler: "packages/functions/mission/create/index.handler",
  environment: {
    ...env,
    SESSION_LAMBDA_NAME: lambdaName("session", "get"),
  },
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [mission.arn] },
    { actions: ["lambda:InvokeFunction"], resources: ["*"] },
  ],
}));

apiPermission("MissionGet", new sst.aws.Function("MissionGet", {
  handler: "packages/functions/mission/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [mission.arn] },
  ],
}));

apiPermission("MissionList", new sst.aws.Function("MissionList", {
  handler: "packages/functions/mission/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [mission.arn, mission.indexArn],
    },
  ],
}));

apiPermission("MissionUpdate", new sst.aws.Function("MissionUpdate", {
  handler: "packages/functions/mission/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [mission.arn] },
  ],
}));

apiPermission("MissionDelete", new sst.aws.Function("MissionDelete", {
  handler: "packages/functions/mission/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [mission.arn] },
  ],
}));

subscribeToBus("MissionObserverRule", {
  handler: "packages/functions/mission/observer/index.lambdaHandler",
  environment: {
    PARENT_TABLE: SESSION_TABLE,
    CHILD_TABLE: mission.name,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [mission.arn, mission.indexArn],
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
