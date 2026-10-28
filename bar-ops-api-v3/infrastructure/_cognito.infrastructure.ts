/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { account, isProduction, optionalEnv, region, requireEnv } from "./_config.infrastructure";

import { AWS_CONFIG } from "@env/config.env";

// Cognito: the user pool + app client every API trusts.
//
// - COGNITO_USER_POOL_ID set (required in production): the existing,
//   console-created pool is used as is, together with COGNITO_CLIENT_ID.
// - Unset (dev, PR stages): the stage creates its own pool, so a token issued
//   for one stage is never accepted by another stage's APIs.
//
// The triggers implement the e-mail OTP flow (custom auth challenge) and put
// new users in the default group.

// Groups checked by RolesGuard (packages/shared/guards/user-role.enum.ts)
const GROUPS = ["Admin", "Manager", "Users"] as const;

// ARN of the verified SES identity for the From address
const sesIdentityArn = $interpolate`arn:aws:ses:${region}:${account}:identity/${AWS_CONFIG.sesFromAddress}`;

// CustomMessage only rewrites the email body, no AWS permissions needed
const authMessage = new sst.aws.Function("AuthMessage", {
  handler: "packages/functions/auth/message/index.handler",
});

const authDefine = new sst.aws.Function("AuthDefine", {
  handler: "packages/functions/auth/define/index.handler",
});

const authCreate = new sst.aws.Function("AuthCreate", {
  handler: "packages/functions/auth/create/index.handler",
  environment: {
    SES_FROM_ADDRESS: AWS_CONFIG.sesFromAddress!,
  },
  permissions: [
    {
      actions: ["ses:SendEmail", "ses:SendRawEmail"],
      resources: [sesIdentityArn],
    },
  ],
});

const authVerify = new sst.aws.Function("AuthVerify", {
  handler: "packages/functions/auth/verify/index.handler",
});

const configuredPoolId = optionalEnv("COGNITO_USER_POOL_ID");
if (isProduction && !configuredPoolId) {
  requireEnv("COGNITO_USER_POOL_ID", "Production must keep using the existing user pool.");
}

const poolArnFor = (poolId: $util.Input<string>) =>
  $interpolate`arn:aws:cognito-idp:${region}:${account}:userpool/${poolId}`;

// Adds every confirmed user to the default "Users" group
const authPostConfirmation = new sst.aws.Function("AuthPostConfirmation", {
  handler: "packages/functions/auth/post-confirmation/index.handler",
  permissions: configuredPoolId
    ? [{ actions: ["cognito-idp:AdminAddUserToGroup"], resources: [poolArnFor(configuredPoolId)] }]
    : [],
});

const createStagePool = () => {
  const pool = new sst.aws.CognitoUserPool("UserPool", {
    usernames: ["email"],
    triggers: {
      customMessage: authMessage.arn,
      defineAuthChallenge: authDefine.arn,
      createAuthChallenge: authCreate.arn,
      verifyAuthChallengeResponse: authVerify.arn,
      postConfirmation: authPostConfirmation.arn,
    },
    transform: {
      userPool: (args) => {
        args.name = `${$app.name}-${$app.stage}`;
        args.autoVerifiedAttributes = ["email"];
      },
    },
  });

  // Server-side login (ADMIN_USER_PASSWORD_AUTH), refresh, OTP custom auth.
  // No hosted UI / OAuth flows.
  const client = pool.addClient("DashboardClient", {
    transform: {
      client: (args) => {
        args.explicitAuthFlows = [
          "ALLOW_ADMIN_USER_PASSWORD_AUTH",
          "ALLOW_CUSTOM_AUTH",
          "ALLOW_REFRESH_TOKEN_AUTH",
        ];
        args.generateSecret = false;
        args.enableTokenRevocation = true;
        args.preventUserExistenceErrors = "ENABLED";
        args.allowedOauthFlowsUserPoolClient = false;
        args.allowedOauthFlows = [];
        args.allowedOauthScopes = [];
        args.callbackUrls = [];
        args.supportedIdentityProviders = ["COGNITO"];
      },
    },
  });

  GROUPS.forEach((group, precedence) => {
    new aws.cognito.UserGroup(`UserPoolGroup${group}`, {
      userPoolId: pool.id,
      name: group,
      precedence,
    });
  });

  // Granted after the pool exists: the pool references this function as a
  // trigger, so the function's own policy cannot reference the pool
  new aws.iam.RolePolicy("AuthPostConfirmationPoolAccess", {
    role: authPostConfirmation.nodes.role.name,
    policy: $jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["cognito-idp:AdminAddUserToGroup"],
          Resource: pool.arn,
        },
      ],
    }),
  });

  return { userPoolId: pool.id, clientId: client.id };
};

const active = configuredPoolId
  ? {
      userPoolId: $output(configuredPoolId),
      clientId: $output(requireEnv("COGNITO_CLIENT_ID", "Required together with COGNITO_USER_POOL_ID.")),
    }
  : createStagePool();

export const cognito = {
  userPoolId: active.userPoolId,
  clientId: active.clientId,
  userPoolArn: poolArnFor(active.userPoolId),
  issuer: $interpolate`https://cognito-idp.${region}.amazonaws.com/${active.userPoolId}`,
};
