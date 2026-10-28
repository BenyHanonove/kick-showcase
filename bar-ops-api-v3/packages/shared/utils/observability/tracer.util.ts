import { Tracer } from '@aws-lambda-powertools/tracer';

// One Tracer per execution environment. Powertools reads POWERTOOLS_SERVICE_NAME and
// POWERTOOLS_TRACE_ENABLED, and switches itself off outside Lambda (local runs, tests),
// in which case captureAWSv3Client returns the client untouched.
export const tracer = new Tracer({ serviceName: process.env.POWERTOOLS_SERVICE_NAME ?? 'kick-api' });

// Wrap an AWS SDK v3 client so each call becomes an X-Ray subsegment (when tracing is on)
export const traceClient = <T>(client: T): T => tracer.captureAWSv3Client(client);
