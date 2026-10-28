/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { adoptOpts, flagEnv, importExisting, importIdFromEnv, importIds, optionalEnv } from "./_config.infrastructure";
import { cognito } from "./_cognito.infrastructure";

// HTTP API (API Gateway v2): API, stage, JWT authorizer, and one route +
// integration per Lambda. Production adopts the console-created API via
// IMPORT_EXISTING=true + HTTP_API_ID; any other stage gets a fresh API.

const importedApiId = importIdFromEnv("HTTP_API_ID");
const stageName = optionalEnv("HTTP_API_STAGE_NAME") ?? "$default";

// Routes/integrations are managed by default. Set MANAGE_API_ROUTES=false on a
// stage whose routes still live in the console and have not been imported yet:
// only the Lambda invoke permissions are then deployed.
const manageRoutes = flagEnv("MANAGE_API_ROUTES", true);

const corsOrigins = optionalEnv("CORS_ALLOW_ORIGINS")?.split(",").map((o) => o.trim()).filter(Boolean);

// On import, keep the console's name/description instead of failing on a diff
const adoptKeeping = (id: string | undefined, keep: string[]): $util.CustomResourceOptions => ({
  ...adoptOpts(id),
  ...(importExisting && id ? { ignoreChanges: keep } : {}),
});

export const httpApi = new aws.apigatewayv2.Api(
  "HttpApi",
  {
    name: `${$app.name}-${$app.stage}`,
    protocolType: "HTTP",
    corsConfiguration: corsOrigins && {
      allowOrigins: corsOrigins,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["authorization", "content-type", "x-user-groups"],
      allowCredentials: true,
      maxAge: 600,
    },
  },
  adoptKeeping(importedApiId, ["name", "description"]),
);

export const httpApiStage = new aws.apigatewayv2.Stage(
  "HttpApiStage",
  { apiId: httpApi.id, name: stageName, autoDeploy: true },
  // Console throttling/logging settings are kept as they are on import
  adoptKeeping(importedApiId && `${importedApiId}/${stageName}`, [
    "defaultRouteSettings",
    "routeSettings",
    "accessLogSettings",
    "description",
  ]),
);

const importedAuthorizerId = importIdFromEnv("HTTP_API_AUTHORIZER_ID");

// Trusts tokens of the active user pool only (see _cognito.infrastructure.ts)
export const httpApiAuthorizer = new aws.apigatewayv2.Authorizer(
  "HttpApiJwtAuthorizer",
  {
    apiId: httpApi.id,
    name: "cognito-jwt",
    authorizerType: "JWT",
    identitySources: ["$request.header.Authorization"],
    jwtConfiguration: {
      issuer: cognito.issuer,
      audiences: [cognito.clientId],
    },
  },
  adoptKeeping(importedApiId && importedAuthorizerId && `${importedApiId}/${importedAuthorizerId}`, ["name"]),
);

interface RouteDef {
  route: string;
  // No JWT authorizer: login/refresh and token-authenticated public links
  public?: true;
}

const crud = (component: string, path: string): Record<string, RouteDef> => ({
  [`${component}Create`]: { route: `POST /${path}` },
  [`${component}Get`]: { route: `GET /${path}/{id}` },
  [`${component}List`]: { route: `GET /${path}` },
  [`${component}Update`]: { route: `PUT /${path}/{id}` },
  [`${component}Delete`]: { route: `DELETE /${path}/{id}` },
});

// Route table, keyed by the sst.aws.Function component name. Reconstructed
// from the handlers (path params read via extractId) and the dashboard
// repositories; it is what used to be wired by hand in the console.
export const ROUTES: Record<string, RouteDef> = {
  AuthLogin: { route: "POST /auth/login", public: true },
  AuthRefresh: { route: "POST /auth/refresh", public: true },
  AuthLogout: { route: "POST /auth/logout", public: true },

  ...crud("Cashier", "cashier"),
  CashierPresign: { route: "POST /cashier/presign" },
  CashierUnsign: { route: "POST /cashier/unsign" },

  ...crud("Client", "client"),

  ...crud("Consume", "consume"),
  ConsumeBatch: { route: "GET /consume/batch" },

  ...crud("Document", "document"),

  ...crud("Employee", "employee"),
  EmployeeRegister: { route: "POST /employee/register", public: true },
  EmployeeResolve: { route: "POST /employee/resolve", public: true },
  EmployeeClaim: { route: "POST /employee/claim", public: true },
  EmployeeLink: { route: "POST /employee/link/{id}" },
  EmployeeRevoke: { route: "POST /employee/revoke/{id}" },
  EmployeeNotify: { route: "POST /employee/notify" },
  EmployeeSummary: { route: "GET /employee/summary/{sessionId}" },

  ...crud("Expense", "expense"),
  ExpensePresign: { route: "POST /expense/presign" },
  ExpenseUnsign: { route: "POST /expense/unsign" },

  ...crud("Interval", "interval"),
  ...crud("Mission", "mission"),
  ...crud("Product", "product"),

  ...crud("Reservation", "reservation"),
  // Public lead form
  ReservationCreate: { route: "POST /reservation", public: true },

  ...crud("Sale", "sale"),
  SaleSummary: { route: "GET /sale/summary/{saleId}" },
  SaleSummaryByMonth: { route: "GET /sale/summary" },

  ...crud("Session", "session"),
  SessionSummary: { route: "GET /session/summary/{sessionId}" },

  ...crud("Shift", "shift"),
  ShiftOpen: { route: "POST /shift/open/{sessionId}" },
  ShiftResolve: { route: "POST /shift/resolve", public: true },
  ShiftRegister: { route: "POST /shift/register", public: true },
  ShiftRevoke: { route: "POST /shift/revoke/{sessionId}" },
  ShiftNotification: { route: "POST /shift/notification/{id}" },
  ShiftNotify: { route: "POST /shift/notify/{sessionId}" },

  ...crud("Supplier", "supplier"),
  SupplierSummary: { route: "GET /supplier/summary/{id}" },

  ...crud("Tips", "tips"),
  ...crud("Vehicle", "vehicle"),
};

// Exposes a function on the HTTP API: invoke permission scoped to its own
// route, plus (unless MANAGE_API_ROUTES=false) the integration and route.
export const apiPermission = (name: string, fn: sst.aws.Function) => {
  const def = ROUTES[name];
  if (!def) throw new Error(`No HTTP route declared for "${name}" in ROUTES (_http-api.infrastructure.ts)`);

  const [method, path] = def.route.split(" ");
  const arnPath = path.replace(/\{[^}]+\}/g, "*");

  new aws.lambda.Permission(`${name}ApiInvoke`, {
    statementId: "apigw-invoke",
    action: "lambda:InvokeFunction",
    function: fn.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: $interpolate`${httpApi.executionArn}/*/${method}${arnPath}`,
  });

  if (!manageRoutes) return;

  const integrationId = importIds.httpIntegrations?.[def.route];
  const integration = new aws.apigatewayv2.Integration(
    `${name}Integration`,
    {
      apiId: httpApi.id,
      integrationType: "AWS_PROXY",
      integrationUri: fn.arn,
      payloadFormatVersion: "2.0",
    },
    adoptKeeping(importedApiId && integrationId && `${importedApiId}/${integrationId}`, [
      "integrationMethod",
      "timeoutMilliseconds",
      "description",
    ]),
  );

  const routeId = importIds.httpRoutes?.[def.route];
  new aws.apigatewayv2.Route(
    `${name}Route`,
    {
      apiId: httpApi.id,
      routeKey: def.route,
      target: $interpolate`integrations/${integration.id}`,
      authorizationType: def.public ? "NONE" : "JWT",
      authorizerId: def.public ? undefined : httpApiAuthorizer.id,
    },
    adoptOpts(importedApiId && routeId ? `${importedApiId}/${routeId}` : undefined),
  );
};
