/// <reference path="../.sst/platform/config.d.ts" />
import { requireEnv, region, account } from "./_config.infrastructure";

// Cognito user pool + app client the APIs trust
const userPoolId = requireEnv("COGNITO_USER_POOL_ID");
const clientId = requireEnv("COGNITO_CLIENT_ID");

export const cognito = {
  userPoolId: $output(userPoolId),
  clientId: $output(clientId),
  userPoolArn: $interpolate`arn:aws:cognito-idp:${region}:${account}:userpool/${userPoolId}`,
  issuer: $interpolate`https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
};
