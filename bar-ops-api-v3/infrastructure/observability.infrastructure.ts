/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { flagEnv, isProduction } from "./_config.infrastructure";
import { alarmActions, kebab, registeredFunctions } from "./_alarms.infrastructure";
import { httpApi, httpApiStage } from "./_http-api.infrastructure";

// Lambda + API Gateway alarms → the stage alarm topic (_alarms.infrastructure.ts).
// Imported last from sst.config.ts so every function is already registered.
//
// Metric-math alarms are billed per metric, so they are on by default only in
// production (ALARMS_ENABLED=true turns them on for another stage). DLQ alarms
// exist on every stage.
if (flagEnv("ALARMS_ENABLED", isProduction)) {
  const prefix = `${$app.name}-${$app.stage}`;

  // Lambda Errors: one alarm per domain module, summing its functions with
  // metric math (CloudWatch allows 10 metrics per alarm, so big modules split)
  const MAX_METRICS = 10;
  for (const [module, names] of registeredFunctions()) {
    for (let i = 0; i < names.length; i += MAX_METRICS) {
      const chunk = names.slice(i, i + MAX_METRICS);
      const part = names.length > MAX_METRICS ? `-${i / MAX_METRICS + 1}` : "";
      const metricIds = chunk.map((_, j) => `e${j}`);

      new aws.cloudwatch.MetricAlarm(`LambdaErrors${kebab(module)}${part}`, {
        name: `${prefix}-lambda-errors-${kebab(module)}${part}`,
        alarmDescription: `Lambda errors in the ${module} module`,
        comparisonOperator: "GreaterThanThreshold",
        threshold: 0,
        evaluationPeriods: 1,
        treatMissingData: "notBreaching",
        metricQueries: [
          {
            id: "total",
            expression: `SUM([${metricIds.join(", ")}])`,
            label: `${module} errors`,
            returnData: true,
          },
          ...chunk.map((functionName, j) => ({
            id: metricIds[j],
            returnData: false,
            metric: {
              namespace: "AWS/Lambda",
              metricName: "Errors",
              dimensions: { FunctionName: functionName },
              stat: "Sum",
              period: 300,
            },
          })),
        ],
        ...alarmActions,
      });
    }
  }

  // Throttles: the account-wide concurrency limit is shared by every
  // function (and stage), so any throttle anywhere matters
  new aws.cloudwatch.MetricAlarm("LambdaThrottles", {
    name: `${prefix}-lambda-throttles`,
    alarmDescription: "Lambda invocations throttled (account concurrency limit reached)",
    namespace: "AWS/Lambda",
    metricName: "Throttles",
    statistic: "Sum",
    period: 300,
    evaluationPeriods: 1,
    threshold: 0,
    comparisonOperator: "GreaterThanThreshold",
    treatMissingData: "notBreaching",
    ...alarmActions,
  });

  const apiDimensions = { ApiId: httpApi.id, Stage: httpApiStage.name };

  new aws.cloudwatch.MetricAlarm("HttpApi5xx", {
    name: `${prefix}-http-api-5xx`,
    alarmDescription: "HTTP API returned 5xx responses",
    namespace: "AWS/ApiGateway",
    metricName: "5xx",
    dimensions: apiDimensions,
    statistic: "Sum",
    period: 300,
    evaluationPeriods: 1,
    threshold: 5,
    comparisonOperator: "GreaterThanOrEqualToThreshold",
    treatMissingData: "notBreaching",
    ...alarmActions,
  });

  new aws.cloudwatch.MetricAlarm("HttpApiLatencyP95", {
    name: `${prefix}-http-api-latency-p95`,
    alarmDescription: "HTTP API p95 latency above 3s for 15 minutes",
    namespace: "AWS/ApiGateway",
    metricName: "Latency",
    dimensions: apiDimensions,
    extendedStatistic: "p95",
    period: 300,
    evaluationPeriods: 3,
    threshold: 3000,
    comparisonOperator: "GreaterThanThreshold",
    treatMissingData: "notBreaching",
    ...alarmActions,
  });
}

export {};
