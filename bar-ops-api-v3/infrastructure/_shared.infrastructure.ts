/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { adoptOpts, importExisting, region, account, optionalEnv, stageResourceName } from "./_config.infrastructure";
import { dynamoTable, type ManagedTable } from "./_tables.infrastructure";
import { createDlq } from "./_alarms.infrastructure";

export { region, account, stageResourceName, dynamoTable };
export { apiPermission } from "./_http-api.infrastructure";

export const getStreamArnPrefix = (tableName: string) => {
  return $interpolate`arn:aws:dynamodb:${region}:${account}:table/${tableName}/stream`;
};

const PROJECT_BUS_NAME = stageResourceName(`${$app.name}-bus`);

// Stage-aware Lambda name; must match sst.config.ts naming rule
export const lambdaName = (service: string, action: string) =>
  `${$app.name}-${$app.stage}-${service}-${action}`;

// ARN of another function of this stage, for scoped lambda:InvokeFunction
export const lambdaArn = (service: string, action: string) =>
  $interpolate`arn:aws:lambda:${region}:${account}:function:${lambdaName(service, action)}`;

// Asset paths inside the shared global bucket
export const FONTS_PREFIX = "fonts";
export const PDF_TEMPLATE_KEY = "pdf/base.pdf";

// Project event bus, carrying every table stream (via pipes) and custom
// events. Adopted by name on stages with IMPORT_EXISTING=true.
export const projectBus = new sst.aws.Bus("ProjectBus", {
  transform: {
    bus: (args, opts) => {
      args.name = PROJECT_BUS_NAME;
      Object.assign(opts, adoptOpts(importExisting ? PROJECT_BUS_NAME : undefined));
    },
  },
});

// Helper to create a Pipe forwarding DynamoDB streams to the bus
export const createStreamPipe = (name: string, table: ManagedTable) => {
  // Use a reliable reference to the table's stream ARN
  const streamArn = table.table.streamArn;

  // Physical name follows the v3 convention: bar-ops-api-v3-<stage>-<service>-pipe
  const pipeName = lambdaName(name.toLowerCase(), "pipe");

  // Records the pipe cannot deliver after its retries land here
  const dlq = createDlq(`${name}Pipe`);

  // Create an IAM Role for the Pipe
  const role = new aws.iam.Role(`${name}PipeRole`, {
    name: `${pipeName}-role`,
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Action: "sts:AssumeRole",
        Principal: { Service: "pipes.amazonaws.com" },
        Effect: "Allow",
      }],
    }),
  });

  // Policy for DynamoDB Stream and EventBridge Bus access
  const policy = new aws.iam.RolePolicy(`${name}PipePolicy`, {
    role: role.id,
    policy: $interpolate`{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "dynamodb:DescribeStream",
            "dynamodb:GetRecords",
            "dynamodb:GetShardIterator",
            "dynamodb:ListStreams"
          ],
          "Resource": "${streamArn}"
        },
        {
          "Effect": "Allow",
          "Action": ["events:PutEvents"],
          "Resource": "${projectBus.nodes.bus.arn}"
        },
        {
          "Effect": "Allow",
          "Action": ["sqs:SendMessage"],
          "Resource": "${dlq.arn}"
        }
      ]
    }`,
  });

  // Wait out IAM propagation to avoid CREATE_FAILED
  const roleArnReady = $resolve([role.arn, policy.id]).apply(async ([roleArn]) => {
    await new Promise((resolve) => setTimeout(resolve, 15000));
    return roleArn;
  });

  // Create the Pipe via AWS Provider; wait for the role policy
  new aws.pipes.Pipe(`${name}Pipe`, {
    name: pipeName,
    roleArn: roleArnReady,
    source: streamArn,
    target: projectBus.nodes.bus.arn,
    sourceParameters: {
      dynamodbStreamParameters: {
        startingPosition: "LATEST",
        batchSize: 1,
        maximumRetryAttempts: 10,
        maximumRecordAgeInSeconds: 24 * 60 * 60,
        deadLetterConfig: { arn: dlq.arn },
      },
    },
  }, { dependsOn: [policy] });
};

// Subscribes an observer Lambda to the bus, with failure handling:
// - EventBridge → Lambda delivery: retried for up to 1h, then the event goes
//   to the subscriber's DLQ (target deadLetterConfig);
// - the Lambda itself fails: async invoke retries twice, then the event goes
//   to the same DLQ (on-failure destination).
export const subscribeToBus = (
  name: string,
  subscriberArgs: sst.aws.FunctionArgs,
  patternArgs: sst.aws.BusSubscriberArgs,
) => {
  const dlq = createDlq(name);

  const subscriber = projectBus.subscribe(
    name,
    {
      ...subscriberArgs,
      retries: 2,
      permissions: $resolve([subscriberArgs.permissions ?? []]).apply(([permissions]) => [
        ...permissions,
        { actions: ["sqs:SendMessage"], resources: [dlq.arn] },
      ]),
      transform: {
        ...subscriberArgs.transform,
        eventInvokeConfig: (args) => {
          args.destinationConfig = { onFailure: { destination: dlq.arn } };
        },
      },
    },
    {
      ...patternArgs,
      transform: {
        ...patternArgs.transform,
        target: (args) => {
          args.deadLetterConfig = { arn: dlq.arn };
          args.retryPolicy = { maximumRetryAttempts: 20, maximumEventAgeInSeconds: 3600 };
        },
      },
    },
  );

  // EventBridge itself writes undeliverable events to the DLQ
  new aws.sqs.QueuePolicy(`${name}DlqPolicy`, {
    queueUrl: dlq.url,
    policy: $jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "events.amazonaws.com" },
          Action: "sqs:SendMessage",
          Resource: dlq.arn,
          Condition: { ArnEquals: { "aws:SourceArn": subscriber.nodes.rule.arn } },
        },
      ],
    }),
  });

  new aws.lambda.Permission(`${name}InvokePermission`, {
    statementId: `allow-eb-invoke-${name.toLowerCase()}`,
    action: "lambda:InvokeFunction",
    function: subscriber.nodes.function.apply((fn) => fn.name),
    principal: "events.amazonaws.com",
    sourceArn: subscriber.nodes.rule.arn,
  });

  return subscriber;
};

// WhatsApp Cloud API access for the functions that send messages. The access
// token is a SecureString in SSM, read by the function at cold start; only
// its parameter name travels in the environment. The default aws/ssm KMS key
// already lets account principals decrypt through SSM, so no kms:Decrypt grant.
export const WHATSAPP_TOKEN_PARAM = `/kick/${$app.stage}/whatsapp-token`;

const phoneNumberId = optionalEnv("WHATSAPP_PHONE_NUMBER_ID");

export const whatsappAccess = () => ({
  environment: {
    WHATSAPP_TOKEN_PARAM,
    // Optional while the WhatsApp service is switched off in code
    ...(phoneNumberId ? { WHATSAPP_PHONE_NUMBER_ID: phoneNumberId } : {}),
  },
  permission: {
    actions: ["ssm:GetParameter"],
    resources: [$interpolate`arn:aws:ssm:${region}:${account}:parameter${WHATSAPP_TOKEN_PARAM}`],
  },
});
