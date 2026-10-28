import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { traceClient } from "@utils/observability/tracer.util";

const client = traceClient(new DynamoDBClient({}));
export const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
    unmarshallOptions: { wrapNumbers: false },
});
