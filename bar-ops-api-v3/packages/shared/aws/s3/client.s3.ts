import { S3Client } from "@aws-sdk/client-s3";
import { traceClient } from "@utils/observability/tracer.util";

export const s3Client = traceClient(new S3Client({}));
