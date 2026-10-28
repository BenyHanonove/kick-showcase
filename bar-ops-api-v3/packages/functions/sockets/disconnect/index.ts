import { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

import { logger } from '@utils/logger/logger.util';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Remove disconnected WebSocket client connection identifier from active database connections
export const handler = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;

  try {
    await docClient.send(new DeleteCommand({
      TableName: process.env.TABLE!,
      Key: { connectionId }
    }));
    return { statusCode: 200, body: 'Disconnected.' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Disconnect Error:', errorMessage);
    return { statusCode: 500, body: 'Failed to disconnect.' };
  }
};
