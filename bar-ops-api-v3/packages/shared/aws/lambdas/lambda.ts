// Import external framework dependencies and status codes from third party packages
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from "aws-lambda";

const lambda = new LambdaClient({});

export async function invokeLambda(
    functionName: string,
    payload: Partial<APIGatewayProxyEventV2>,
    originalEvent: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
    const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({
            ...payload,
            requestContext: originalEvent.requestContext,
        }),
    });

    const response = await lambda.send(command);
    const result = JSON.parse(Buffer.from(response.Payload!).toString());

    if (response.FunctionError) {
        throw new Error(`Lambda ${functionName} failed: ${result.errorMessage || "Unknown error"}`);
    }
    return result;
}
