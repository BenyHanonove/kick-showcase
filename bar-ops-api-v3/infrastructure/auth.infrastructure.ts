/// <reference path="../.sst/platform/config.d.ts" />
import { region, account, apiPermission } from "./_shared.infrastructure";
import { cognito } from "./_cognito.infrastructure";

import { AWS_CONFIG } from "@env/config.env";

const userPoolArn = cognito.userPoolArn;

// ARN of the verified SES identity for the From address
const sesIdentityArn = $interpolate`arn:aws:ses:${region}:${account}:identity/${AWS_CONFIG.sesFromAddress}`;

// CustomMessage only rewrites the email body, no AWS permissions needed
new sst.aws.Function("AuthMessage", {
  handler: "packages/functions/auth/message/index.handler",
});

new sst.aws.Function("AuthDefine", {
  handler: "packages/functions/auth/define/index.handler",
});

new sst.aws.Function("AuthCreate", {
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

new sst.aws.Function("AuthVerify", {
  handler: "packages/functions/auth/verify/index.handler",
});

new sst.aws.Function("AuthPostConfirmation", {
  handler: "packages/functions/auth/post-confirmation/index.handler",
  permissions: [
    {
      actions: ["cognito-idp:AdminAddUserToGroup"],
      resources: [userPoolArn],
    },
  ],
});

// Public HTTP routes (no JWT authorizer, see ROUTES)
apiPermission("AuthLogin", new sst.aws.Function("AuthLogin", {
  handler: "packages/functions/auth/login/index.handler",
  environment: {
    COGNITO_USER_POOL_ID: cognito.userPoolId,
    COGNITO_CLIENT_ID: cognito.clientId,
  },
  permissions: [
    {
      actions: ["cognito-idp:AdminUserGlobalSignOut", "cognito-idp:AdminInitiateAuth"],
      resources: [userPoolArn],
    },
  ],
}));

apiPermission("AuthRefresh", new sst.aws.Function("AuthRefresh", {
  handler: "packages/functions/auth/refresh/index.handler",
  environment: {
    COGNITO_CLIENT_ID: cognito.clientId,
  },
  // Public InitiateAuth needs no Cognito IAM permission
}));

apiPermission("AuthLogout", new sst.aws.Function("AuthLogout", {
  handler: "packages/functions/auth/logout/index.handler",
  environment: {
    COGNITO_CLIENT_ID: cognito.clientId,
  },
  // RevokeToken / GlobalSignOut needs no Cognito IAM permission either
}));
