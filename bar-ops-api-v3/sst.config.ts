/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "bar-ops-api-v3",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const aws = await import("@pulumi/aws");
    const fs = await import("fs");
    const path = await import("path");

    // Non-prod stages must not fall back to prod .env
    if ($app.stage !== "production" && !fs.existsSync(`.env.${$app.stage}`)) {
      throw new Error(`Missing .env.${$app.stage} — refusing to deploy stage "${$app.stage}" with production values`);
    }

    const { region, account, optionalEnv, isProduction } = await import("./infrastructure/_config.infrastructure");
    const { registerFunction } = await import("./infrastructure/_alarms.infrastructure");
    const logLevel = optionalEnv("POWERTOOLS_LOG_LEVEL") ?? (isProduction ? "INFO" : "DEBUG");

    $transform(sst.aws.Function, (args, opts, name) => {
      if (!args) return;
      args.runtime ??= "nodejs24.x";
      args.memory ??= "128 MB";

      // Forward Redis environment variables to all Lambda functions
      if (!process.env.REDIS_HOST) {
        throw new Error("CRITICAL CONFIGURATION ERROR: REDIS_HOST environment variable is missing!");
      }
      if (!process.env.REDIS_PORT) {
        throw new Error("CRITICAL CONFIGURATION ERROR: REDIS_PORT environment variable is missing!");
      }

      // Duck-type guard for wrapped vs plain Pulumi Output
      interface OutputLike<T> {
        apply: (fn: (value: T) => T) => unknown;
      }
      const isOutputLike = <T,>(value: unknown): value is OutputLike<T> =>
        typeof value === "object" && value !== null &&
        typeof (value as OutputLike<T>).apply === "function";

      // Domain module of the handler (packages/functions/<module>/<action>)
      const handlerParts = typeof args.handler === "string" ? args.handler.split("/") : [];
      const service = handlerParts.length >= 4 ? handlerParts[2] : "kick-api";

      // Password stays in SSM, read at cold start
      const redisPasswordParam = `/bar-ops-api-v3/${$app.stage}/redis-password`;
      const redisEnv: Record<string, string> = {
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: process.env.REDIS_PORT,
        REDIS_PASSWORD_PARAM: redisPasswordParam,
        // Powertools Logger/Tracer: one service per domain module
        POWERTOOLS_SERVICE_NAME: service,
        POWERTOOLS_LOG_LEVEL: logLevel,
      };

      const envInput = args.environment;
      if (isOutputLike<Record<string, string>>(envInput)) {
        args.environment = envInput.apply((actualEnv) => ({
          ...actualEnv,
          ...redisEnv,
        })) as typeof args.environment;
      } else {
        args.environment = { ...((envInput || {}) as Record<string, string>), ...redisEnv };
      }

      // Grant every function read access to its stage's Redis password parameter
      const ssmPermission: { actions: string[]; resources: $util.Input<string>[] } = {
        actions: ["ssm:GetParameter"],
        resources: [$interpolate`arn:aws:ssm:${region}:${account}:parameter${redisPasswordParam}`],
      };
      // X-Ray segment upload; these actions support no resource scoping
      const xrayPermission: typeof ssmPermission = {
        actions: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
        resources: ["*"],
      };
      const permsInput = args.permissions;
      if (isOutputLike<(typeof ssmPermission)[]>(permsInput)) {
        args.permissions = permsInput.apply((actualPerms) => [
          ...(actualPerms || []),
          ssmPermission,
          xrayPermission,
        ]) as typeof args.permissions;
      } else {
        args.permissions = [...((permsInput || []) as (typeof ssmPermission)[]), ssmPermission, xrayPermission];
      }

      // Active X-Ray tracing on every function, composed with any per-function transform
      const fnTransform = args.transform?.function;
      args.transform = {
        ...args.transform,
        function: (fnArgs, fnOpts, fnName) => {
          if (typeof fnTransform === "function") fnTransform(fnArgs, fnOpts, fnName);
          else if (fnTransform) Object.assign(fnArgs, fnTransform);
          fnArgs.tracingConfig = { mode: "Active" };
        },
      };

      // Derive a clean name from the handler path
      let cleanName = name.replace(/Handler$/, "");
      if (typeof args.handler === "string") {
        const parts = args.handler.split("/");
        if (parts.length >= 4) {
          cleanName = `${parts[2]}-${parts[3]}`;
        }
      } else {
        // Fallback to kebab-case conversion of the component name
        cleanName = cleanName
          .replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())
          .replace(/^-/, "");
      }

      const functionName = `${$app.name}-${$app.stage}-${cleanName}`;
      args.name ??= functionName;

      // Collected for the per-module error alarms (observability.infrastructure.ts)
      registerFunction(service, args.name);

      // Register shareable test events if events.json exists
      if (typeof args.handler === "string") {
        const handlerDir = path.dirname(args.handler);
        const eventsPath = path.join(handlerDir, "events.json");

        if (fs.existsSync(eventsPath)) {
          interface TestEvent {
            name: string;
            content: unknown;
          }
          const events = JSON.parse(fs.readFileSync(eventsPath, "utf8")) as TestEvent[];
          const examples: Record<string, { value: unknown }> = {};
          events.forEach((event: TestEvent) => {
            examples[event.name] = { value: event.content };
          });

          new aws.schemas.Schema(`_test-events-${cleanName}`, {
            registryName: "lambda-testevent-schemas",
            name: `_${functionName}-schema`,
            type: "OpenApi3",
            content: JSON.stringify({
              openapi: "3.0.0",
              info: {
                title: "LambdaTestEvents",
                version: "1.0.1",
              },
              paths: {},
              components: {
                examples,
              },
            }),
          });
        }
      }
    });
    await import("./infrastructure/auth.infrastructure");
    await import("./infrastructure/cashier.infrastructure");
    await import("./infrastructure/client.infrastructure");
    await import("./infrastructure/consume.infrastructure");
    await import("./infrastructure/document.infrastructure");
    await import("./infrastructure/employee.infrastructure");
    await import("./infrastructure/expense.infrastructure");
    await import("./infrastructure/interval.infrastructure");
    await import("./infrastructure/product.infrastructure");
    await import("./infrastructure/reservation.infrastructure");
    await import("./infrastructure/sale.infrastructure");
    await import("./infrastructure/session.infrastructure");
    await import("./infrastructure/shift.infrastructure");
    await import("./infrastructure/mission.infrastructure");
    await import("./infrastructure/supplier.infrastructure");
    await import("./infrastructure/tips.infrastructure");
    await import("./infrastructure/vehicle.infrastructure");
    await import("./infrastructure/websocket.infrastructure");
    // Last: alarms over every function registered above
    await import("./infrastructure/observability.infrastructure");

    // Bootstrap bucket lifecycle rule owned by production
    if ($app.stage === "production") {
      const bootstrapParam = await aws.ssm.getParameter({
        name: "/sst/bootstrap",
      });
      const bootstrapData = JSON.parse(bootstrapParam.value);

      new aws.s3.BucketLifecycleConfigurationV2("sst-asset-lifecycle", {
        bucket: bootstrapData.asset,
        rules: [
          {
            id: "DeleteOldSSTAssets",
            status: "Enabled",
            expiration: {
              days: 7,
            },
          },
        ],
      });
    }

    return {};
  },
});
