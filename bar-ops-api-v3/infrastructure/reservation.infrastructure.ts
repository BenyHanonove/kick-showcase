/// <reference path="../.sst/platform/config.d.ts" />
import { dynamoTable, createStreamPipe, stageResourceName, apiPermission } from "./_shared.infrastructure";

const RESERVATION_TABLE = stageResourceName("BarOps-Reservation");

const reservation = dynamoTable("BarOps-Reservation");
const env = { TABLE: reservation.name };

createStreamPipe("Reservation", reservation);

apiPermission("ReservationCreate", new sst.aws.Function("ReservationCreate", {
  handler: "packages/functions/reservation/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:PutItem"], resources: [reservation.arn] },
  ],
}));

apiPermission("ReservationGet", new sst.aws.Function("ReservationGet", {
  handler: "packages/functions/reservation/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [reservation.arn] },
  ],
}));

apiPermission("ReservationList", new sst.aws.Function("ReservationList", {
  handler: "packages/functions/reservation/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [reservation.arn, reservation.indexArn],
    },
  ],
}));

apiPermission("ReservationUpdate", new sst.aws.Function("ReservationUpdate", {
  handler: "packages/functions/reservation/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [reservation.arn] },
  ],
}));

apiPermission("ReservationDelete", new sst.aws.Function("ReservationDelete", {
  handler: "packages/functions/reservation/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [reservation.arn] },
  ],
}));
