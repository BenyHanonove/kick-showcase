// Import external framework dependencies and status codes from third party packages
import { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Import shared AWS services, guard security middleware, and utility helpers
import { logger } from '@utils/logger/logger.util';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Room ids are entity uuids; reject anything else
const ROOM_ID_PATTERN = /^[\w-]{1,64}$/;

interface RoomMessage {
  action?: string;
  roomId?: string;
}

// Handle incoming fallback WebSocket message frames and dispatch appropriate route actions
export const handler = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;

  let message: RoomMessage;
  try {
    message = JSON.parse(event.body || '{}') as RoomMessage;
  } catch {
    return { statusCode: 400, body: 'Invalid message format.' };
  }

  if (message.action === 'joinRoom') {
    if (typeof message.roomId !== 'string' || !ROOM_ID_PATTERN.test(message.roomId)) {
      return { statusCode: 400, body: 'Invalid room id.' };
    }

    try {
      // Row must exist from $connect; never create here
      await docClient.send(new UpdateCommand({
        TableName: process.env.TABLE!,
        Key: { connectionId },
        UpdateExpression: 'SET roomId = :roomId',
        ConditionExpression: 'attribute_exists(connectionId)',
        ExpressionAttributeValues: { ':roomId': message.roomId },
      }));
      return { statusCode: 200, body: 'Room joined.' };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to join room for connection ${connectionId}:`, errorMessage);
      return { statusCode: 500, body: 'Failed to join room.' };
    }
  }

  if (message.action === 'leaveRoom') {
    try {
      await docClient.send(new UpdateCommand({
        TableName: process.env.TABLE!,
        Key: { connectionId },
        UpdateExpression: 'REMOVE roomId',
        ConditionExpression: 'attribute_exists(connectionId)',
      }));
      return { statusCode: 200, body: 'Room left.' };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to leave room for connection ${connectionId}:`, errorMessage);
      return { statusCode: 500, body: 'Failed to leave room.' };
    }
  }

  return { statusCode: 200, body: 'Action not recognized.' };
};
