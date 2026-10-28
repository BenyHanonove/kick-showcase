/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { dynamoTable, projectBus, createStreamPipe, getStreamArnPrefix, stageResourceName, lambdaName, region, account, apiPermission, subscribeToBus } from "./_shared.infrastructure";

import { AWS_CONFIG } from "@env/config.env";

const SHIFT_TABLE = stageResourceName("BarOps-Shift");
const SESSION_TABLE = stageResourceName("BarOps-Session");
const SHIFT_TOKEN_TABLE = stageResourceName("BarOps-ShiftRegistrationToken");

const shift = dynamoTable(SHIFT_TABLE);
const shiftToken = dynamoTable(SHIFT_TOKEN_TABLE);
const env = { TABLE: shift.name };

createStreamPipe("Shift", shift);

subscribeToBus("ShiftSyncIntervalRule", {
  handler: "packages/functions/shift/sync-interval/index.lambdaHandler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:UpdateItem"], resources: [shift.arn] },
  ],
}, {
  pattern: {
    source: ["interval.sync"],
    detailType: ["IntervalSync"]
  }
});

subscribeToBus("ShiftSyncVehicleRule", {
  handler: "packages/functions/shift/sync-vehicle/index.lambdaHandler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:UpdateItem"], resources: [shift.arn] },
  ],
}, {
  pattern: {
    source: ["vehicle.sync"],
    detailType: ["VehicleSync"]
  }
});

apiPermission("ShiftCreate", new sst.aws.Function("ShiftCreate", {
  handler: "packages/functions/shift/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [shift.arn] },
  ],
}));

apiPermission("ShiftGet", new sst.aws.Function("ShiftGet", {
  handler: "packages/functions/shift/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [shift.arn] },
  ],
}));

apiPermission("ShiftList", new sst.aws.Function("ShiftList", {
  handler: "packages/functions/shift/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [shift.arn, shift.indexArn],
    },
  ],
}));

apiPermission("ShiftUpdate", new sst.aws.Function("ShiftUpdate", {
  handler: "packages/functions/shift/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [shift.arn] },
  ],
}));

apiPermission("ShiftDelete", new sst.aws.Function("ShiftDelete", {
  handler: "packages/functions/shift/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [shift.arn] },
  ],
}));

subscribeToBus("ShiftObserverRule", {
  handler: "packages/functions/shift/observer/index.lambdaHandler",
  environment: {
    PARENT_TABLE: SESSION_TABLE,
    CHILD_TABLE: shift.name,
  },
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"],
      resources: [shift.arn, shift.indexArn],
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

// token table - session, client and employees all come from invoked lambdas
apiPermission("ShiftOpen", new sst.aws.Function("ShiftOpen", {
  handler: "packages/functions/shift/open/index.handler",
  environment: {
    ...env,
    TOKEN_TABLE: shiftToken.name,
    SESSION_GET_LAMBDA_NAME: lambdaName("session", "get"),
    CLIENT_GET_LAMBDA_NAME: lambdaName("client", "get"),
    EMPLOYEE_GET_LAMBDA_NAME: lambdaName("employee", "get"),
    WHATSAPP_ACCESS_TOKEN: AWS_CONFIG.whatsapp.accessToken!,
    WHATSAPP_PHONE_NUMBER_ID: AWS_CONFIG.whatsapp.phoneNumberId!,
  },
  permissions: [
    { actions: ["dynamodb:Query", "dynamodb:PutItem", "dynamodb:DeleteItem"], resources: [shiftToken.arn, shiftToken.indexArn] },
    // Query only to skip an employee who already has a shift on the event
    { actions: ["dynamodb:Query"], resources: [shift.arn, shift.indexArn] },
    {
      actions: ["lambda:InvokeFunction"],
      resources: [
        $interpolate`arn:aws:lambda:${region}:${account}:function:${lambdaName("session", "get")}`,
        $interpolate`arn:aws:lambda:${region}:${account}:function:${lambdaName("client", "get")}`,
        $interpolate`arn:aws:lambda:${region}:${account}:function:${lambdaName("employee", "get")}`,
      ],
    },
  ],
}));

apiPermission("ShiftResolve", new sst.aws.Function("ShiftResolve", {
  handler: "packages/functions/shift/resolve/index.handler",
  environment: {
    ...env,
    TOKEN_TABLE: shiftToken.name,
  },
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [shiftToken.arn] },
    { actions: ["dynamodb:Query"], resources: [shift.arn, shift.indexArn] },
  ],
}));

apiPermission("ShiftRegister", new sst.aws.Function("ShiftRegister", {
  handler: "packages/functions/shift/register/index.handler",
  environment: {
    ...env,
    TOKEN_TABLE: shiftToken.name,
  },
  permissions: [
    // Read the token to learn who/which event, then destroy it.
    // link is deleted, never flagged, so this lambda can never
    { actions: ["dynamodb:GetItem", "dynamodb:DeleteItem"], resources: [shiftToken.arn] },
    // Query only to refuse an employee already staffed on the event
    { actions: ["dynamodb:Query"], resources: [shift.arn, shift.indexArn] },
    // Create only - it can never read, edit or delete
    { actions: ["dynamodb:PutItem"], resources: [shift.arn] },
  ],
}));

apiPermission("ShiftRevoke", new sst.aws.Function("ShiftRevoke", {
  handler: "packages/functions/shift/revoke/index.handler",
  environment: {
    TOKEN_TABLE: shiftToken.name,
  },
  permissions: [
    { actions: ["dynamodb:Query", "dynamodb:BatchWriteItem"], resources: [shiftToken.arn, shiftToken.indexArn] },
  ],
}));

const shiftNotification = new sst.aws.Function("ShiftNotification", {
  handler: "packages/functions/shift/notification/index.handler",
  environment: {
    ...env,
    SESSION_GET_LAMBDA_NAME: lambdaName("session", "get"),
    SHIFT_LIST_LAMBDA_NAME: lambdaName("shift", "list"),
    EMPLOYEE_LIST_LAMBDA_NAME: lambdaName("employee", "list"),
    WHATSAPP_ACCESS_TOKEN: AWS_CONFIG.whatsapp.accessToken!,
    WHATSAPP_PHONE_NUMBER_ID: AWS_CONFIG.whatsapp.phoneNumberId!,
  },
  permissions: [
    { actions: ["lambda:InvokeFunction"], resources: ["*"] },
  ],
});

apiPermission("ShiftNotification", shiftNotification, "*/*/shift/notification/*");

const shiftNotify = new sst.aws.Function("ShiftNotify", {
  handler: "packages/functions/shift/notify/index.handler",
  environment: {
    ...env,
    SESSION_GET_LAMBDA_NAME: lambdaName("session", "get"),
    EMPLOYEE_NOTIFY_LAMBDA_NAME: lambdaName("employee", "notify"),
  },
  permissions: [
    { actions: ["dynamodb:Query"], resources: [shift.arn, shift.indexArn] },
    {
      actions: ["lambda:InvokeFunction"],
      resources: [
        $interpolate`arn:aws:lambda:${region}:${account}:function:${lambdaName("session", "get")}`,
        $interpolate`arn:aws:lambda:${region}:${account}:function:${lambdaName("employee", "notify")}`,
      ],
    },
  ],
});

apiPermission("ShiftNotify", shiftNotify, "*/*/shift/notify/*");
