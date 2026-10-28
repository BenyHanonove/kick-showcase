/// <reference path="../.sst/platform/config.d.ts" />
import { apiPermission } from "./_shared.infrastructure";
import { cognito } from "./_cognito.infrastructure";

const userPoolArn = cognito.userPoolArn;

// Cognito trigger functions (message/define/create/verify/post-confirmation)
// live next to the pool in _cognito.infrastructure.ts

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
