/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { dynamoTable, stageResourceName, lambdaName, region, account, FONTS_PREFIX, apiPermission, lambdaArn } from "./_shared.infrastructure";

import { AWS_CONFIG } from "@env/config.env";

const EMPLOYEE_TABLE = stageResourceName("BarOps-Employee");
const EMPLOYEE_TOKEN_TABLE = stageResourceName("BarOps-EmployeeUpdateToken");

const employee = dynamoTable("BarOps-Employee");
const employeeToken = dynamoTable("BarOps-EmployeeUpdateToken");
const env = { TABLE: employee.name };

// Meta WhatsApp Cloud API credentials shared by the notify + link functions
const whatsappEnv = {
  WHATSAPP_ACCESS_TOKEN: AWS_CONFIG.whatsapp.accessToken!,
  WHATSAPP_PHONE_NUMBER_ID: AWS_CONFIG.whatsapp.phoneNumberId!,
};

apiPermission("EmployeeCreate", new sst.aws.Function("EmployeeCreate", {
  handler: "packages/functions/employee/create/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:Query", "dynamodb:PutItem", "dynamodb:Scan"], resources: [employee.arn, employee.indexArn] },
  ],
}));

apiPermission("EmployeeRegister", new sst.aws.Function("EmployeeRegister", {
  handler: "packages/functions/employee/register/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:Query", "dynamodb:PutItem", "dynamodb:Scan"], resources: [employee.arn, employee.indexArn] },
  ],
}));

apiPermission("EmployeeGet", new sst.aws.Function("EmployeeGet", {
  handler: "packages/functions/employee/get/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [employee.arn] },
  ],
}));

apiPermission("EmployeeList", new sst.aws.Function("EmployeeList", {
  handler: "packages/functions/employee/list/index.handler",
  environment: env,
  permissions: [
    {
      actions: ["dynamodb:Query", "dynamodb:Scan"],
      resources: [employee.arn, employee.indexArn],
    },
  ],
}));

apiPermission("EmployeeUpdate", new sst.aws.Function("EmployeeUpdate", {
  handler: "packages/functions/employee/update/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [employee.arn] },
  ],
}));

apiPermission("EmployeeDelete", new sst.aws.Function("EmployeeDelete", {
  handler: "packages/functions/employee/delete/index.handler",
  environment: env,
  permissions: [
    { actions: ["dynamodb:DeleteItem"], resources: [employee.arn] },
  ],
}));

apiPermission("EmployeeLink", new sst.aws.Function("EmployeeLink", {
  handler: "packages/functions/employee/link/index.handler",
  environment: {
    ...env,
    ...whatsappEnv,
    TOKEN_TABLE: employeeToken.name,
  },
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [employee.arn] },
    { actions: ["dynamodb:Query", "dynamodb:PutItem", "dynamodb:DeleteItem"], resources: [employeeToken.arn, employeeToken.indexArn] },
  ],
}));

apiPermission("EmployeeResolve", new sst.aws.Function("EmployeeResolve", {
  handler: "packages/functions/employee/resolve/index.handler",
  environment: {
    ...env,
    TOKEN_TABLE: employeeToken.name,
  },
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [employee.arn] },
    { actions: ["dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem"], resources: [employeeToken.arn] },
  ],
}));

apiPermission("EmployeeClaim", new sst.aws.Function("EmployeeClaim", {
  handler: "packages/functions/employee/claim/index.handler",
  environment: {
    ...env,
    TOKEN_TABLE: employeeToken.name,
  },
  permissions: [
    { actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"], resources: [employee.arn] },
    { actions: ["dynamodb:UpdateItem"], resources: [employeeToken.arn] },
  ],
}));

apiPermission("EmployeeRevoke", new sst.aws.Function("EmployeeRevoke", {
  handler: "packages/functions/employee/revoke/index.handler",
  environment: {
    TOKEN_TABLE: employeeToken.name,
  },
  permissions: [
    { actions: ["dynamodb:Query", "dynamodb:DeleteItem"], resources: [employeeToken.arn, employeeToken.indexArn] },
  ],
}));

apiPermission("EmployeeNotify", new sst.aws.Function("EmployeeNotify", {
  handler: "packages/functions/employee/notify/index.handler",
  environment: {
    ...env,
    ...whatsappEnv,
  },
  permissions: [
    { actions: ["dynamodb:GetItem"], resources: [employee.arn] },
  ],
}));

const employeeSummary = new sst.aws.Function("EmployeeSummary", {
  handler: "packages/functions/employee/summary/index.handler",
  memory: "512 MB",
  timeout: "30 seconds",
  environment: {
    ...env,
    SESSION_LAMBDA_NAME: lambdaName("session", "get"),
    SHIFT_LAMBDA_NAME: lambdaName("shift", "list"),
    GLOBAL_BUCKET: AWS_CONFIG.s3.globalBucket!,
    FONTS_PREFIX,
  },
  permissions: [
    { actions: ["dynamodb:BatchGetItem"], resources: [employee.arn] },
    {
      actions: ["lambda:InvokeFunction"],
      resources: [
        lambdaArn("session", "get"),
        lambdaArn("shift", "list"),
      ],
    },
  ],
  nodejs: {
    install: ["exceljs"],
  },
});

apiPermission("EmployeeSummary", employeeSummary);
