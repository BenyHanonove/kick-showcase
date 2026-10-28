/// <reference path="../.sst/platform/config.d.ts" />
import { dynamoTable, projectBus, createStreamPipe, getStreamArnPrefix, stageResourceName, apiPermission, subscribeToBus } from "./_shared.infrastructure";

const VEHICLE_TABLE = stageResourceName("BarOps-Vehicle");
const SESSION_TABLE = stageResourceName("BarOps-Session");

const vehicle = dynamoTable(VEHICLE_TABLE);
const env = { TABLE: vehicle.name };

createStreamPipe("Vehicle", vehicle);

// Subscribe the Vehicle Sync-Shift to Vehicle table stream events
subscribeToBus("VehicleSyncShiftRule", {
  handler: "packages/functions/vehicle/sync-shift/index.lambdaHandler",
  environment: { EVENT_BUS_NAME: projectBus.name },
  permissions: [
    { actions: ["events:PutEvents"], resources: [projectBus.nodes.bus.arn] },
  ],
}, {
  pattern: {
    detail: {
      eventSourceARN: [{ prefix: getStreamArnPrefix(VEHICLE_TABLE) }],
      eventName: ["INSERT", "MODIFY", "REMOVE"],
      dynamodb: {
        Keys: {
          id: { S: [{ exists: true }] }
        }
      }
    }
  }
});

subscribeToBus("VehicleObserverRule", {
  handler: "packages/functions/vehicle/observer/index.lambdaHandler",
  environment: {
    PARENT_TABLE: SESSION_TABLE,
    CHILD_TABLE: vehicle.name,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [vehicle.arn, vehicle.indexArn],
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

apiPermission("VehicleCreate", new sst.aws.Function("VehicleCreate", {
  handler: "packages/functions/vehicle/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [vehicle.arn] },
  ],
}));

apiPermission("VehicleGet", new sst.aws.Function("VehicleGet", {
  handler: "packages/functions/vehicle/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [vehicle.arn] },
  ],
}));

apiPermission("VehicleList", new sst.aws.Function("VehicleList", {
  handler: "packages/functions/vehicle/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [vehicle.arn, vehicle.indexArn],
    },
  ],
}));

apiPermission("VehicleUpdate", new sst.aws.Function("VehicleUpdate", {
  handler: "packages/functions/vehicle/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [vehicle.arn] },
  ],
}));

apiPermission("VehicleDelete", new sst.aws.Function("VehicleDelete", {
  handler: "packages/functions/vehicle/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [vehicle.arn] },
  ],
}));
