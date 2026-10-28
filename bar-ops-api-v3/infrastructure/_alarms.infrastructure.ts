/// <reference path="../.sst/platform/config.d.ts" />
import * as aws from "@pulumi/aws";
import { optionalEnv } from "./_config.infrastructure";

// Every CloudWatch alarm of the stage notifies this topic. ALARM_EMAIL (optional)
// subscribes an address; AWS sends it a confirmation e-mail on first deploy.
export const alarmTopic = new aws.sns.Topic("AlarmTopic", {
  name: `${$app.name}-${$app.stage}-alarms`,
});

const alarmEmail = optionalEnv("ALARM_EMAIL");
if (alarmEmail) {
  new aws.sns.TopicSubscription("AlarmEmailSubscription", {
    topic: alarmTopic.arn,
    protocol: "email",
    endpoint: alarmEmail,
  });
}

export const alarmActions = {
  alarmActions: [alarmTopic.arn],
  okActions: [alarmTopic.arn],
};

// Physical names: <app>-<stage>-<kebab-name>
export const kebab = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^A-Za-z0-9-]/g, "-").toLowerCase();

// Dead-letter queue + "anything in it" alarm. Messages are kept 14 days so a
// failed cascade/broadcast can be inspected and redriven.
export const createDlq = (name: string) => {
  const queue = new aws.sqs.Queue(`${name}Dlq`, {
    name: `${$app.name}-${$app.stage}-${kebab(name)}-dlq`,
    messageRetentionSeconds: 14 * 24 * 60 * 60,
    sqsManagedSseEnabled: true,
  });

  new aws.cloudwatch.MetricAlarm(`${name}DlqAlarm`, {
    name: `${$app.name}-${$app.stage}-${kebab(name)}-dlq-not-empty`,
    alarmDescription: `Failed events landed in the ${name} dead-letter queue`,
    namespace: "AWS/SQS",
    metricName: "ApproximateNumberOfMessagesVisible",
    dimensions: { QueueName: queue.name },
    statistic: "Maximum",
    period: 300,
    evaluationPeriods: 1,
    threshold: 0,
    comparisonOperator: "GreaterThanThreshold",
    treatMissingData: "notBreaching",
    ...alarmActions,
  });

  return queue;
};
