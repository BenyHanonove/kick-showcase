/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { requireEnv } from "./_config.infrastructure";

export const region = aws.getRegionOutput().name;
export const account = aws.getCallerIdentityOutput({}).accountId;

export const getStreamArnPrefix = (tableName: string) => {
  return $interpolate`arn:aws:dynamodb:${region}:${account}:table/${tableName}/stream`;
};

// Resolves base resource name to its stage variant (dev- prefix)
export const stageResourceName = (baseName: string) =>
  $app.stage === "production" ? baseName : `dev-${baseName}`;

const PROJECT_BUS_NAME = stageResourceName(`${$app.name}-bus`);

// Stage-aware Lambda name; must match sst.config.ts naming rule
export const lambdaName = (service: string, action: string) =>
  `${$app.name}-${$app.stage}-${service}-${action}`;

// Asset paths inside the shared global bucket
export const FONTS_PREFIX = "fonts";
export const PDF_TEMPLATE_KEY = "pdf/base.pdf";

// Console-created resources, referenced by id from .env.<stage>
export const COGNITO_USER_POOL_ID = requireEnv("COGNITO_USER_POOL_ID");
export const COGNITO_CLIENT_ID = requireEnv("COGNITO_CLIENT_ID");
export const HTTP_API_ID = requireEnv("HTTP_API_ID");
export const WEBSOCKET_ENDPOINT = requireEnv("WEBSOCKET_ENDPOINT");

// Execution ARN of the HTTP API, resolved from its id at deploy time
export const httpApiExecutionArn = aws.apigatewayv2.getApiOutput({ apiId: HTTP_API_ID }).executionArn;

// Grants the HTTP API Gateway permission to invoke a Lambda function
export const apiPermission = (name: string, fn: sst.aws.Function, routePath = "*/*/*") => {
  new aws.lambda.Permission(`${name}ApiInvoke`, {
    statementId: "apigw-invoke",
    action: "lambda:InvokeFunction",
    function: fn.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: $interpolate`${httpApiExecutionArn}/${routePath}`,
  });
};

// References an existing DynamoDB table from the AWS Dashboard.
export const dynamoTable = (name: string) => {
  const arn = $interpolate`arn:aws:dynamodb:${region}:${account}:table/${name}`;
  return {
    name,
    arn,
    indexArn: $interpolate`${arn}/index/*`,
    streamArn: $interpolate`${arn}/stream/*`,
    // Helper to get the underlying Pulumi resource for SST
    table: aws.dynamodb.Table.get(name, name),
  };
};

// References the existing EventBridge Project Bus.
export const projectBus = sst.aws.Bus.get("ProjectBus", PROJECT_BUS_NAME);

// Helper to create a Pipe forwarding DynamoDB streams to the bus
export const createStreamPipe = (name: string, table: ReturnType<typeof dynamoTable>) => {
  // Use a reliable reference to the table's stream ARN
  const streamArn = table.table.streamArn;

  // Physical name follows the v3 convention: bar-ops-api-v3-<stage>-<service>-pipe
  const pipeName = lambdaName(name.toLowerCase(), "pipe");

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
      },
    },
  }, { dependsOn: [policy] });
};

// Shared wrapper to guarantee Lambda invocation permissions
export const subscribeToBus = (
  name: string,
  subscriberArgs: Parameters<typeof projectBus.subscribe>[1],
  patternArgs: Parameters<typeof projectBus.subscribe>[2]
) => {
  const subscriber = projectBus.subscribe(name, subscriberArgs, patternArgs);

  new aws.lambda.Permission(`${name}InvokePermission`, {
    statementId: `allow-eb-invoke-${name.toLowerCase()}`,
    action: "lambda:InvokeFunction",
    function: subscriber.nodes.function.apply((fn) => fn.name),
    principal: "events.amazonaws.com",
    sourceArn: subscriber.nodes.rule.arn,
  });

  return subscriber;
};
