// Import external framework dependencies and status codes from third party packages
import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

// Import shared AWS services, guard security middleware, and utility helpers
import { logger } from '@utils/logger/logger.util';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const apiGwClient = new ApiGatewayManagementApiClient({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

type ClientAction = 'CREATE' | 'UPDATE' | 'DELETE';

// Notification only; clients fetch full data via REST API
interface StorePayload {
  action: ClientAction;
  targetStore: string;
  id: string;
  editor?: string;
}

// Payload plus routing key, never sent to clients
interface RoutedPayload {
  payload: StorePayload;
  roomKey?: string;
}

interface ConnectionRecord {
  connectionId: string;
  roomId?: string;
}

// Broadcast real-time event updates to all connected WebSocket clients across API
export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  // 1. Fetch active WebSocket clients with their room membership
  let connections: ConnectionRecord[] = [];
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: process.env.TABLE!,
      ProjectionExpression: 'connectionId, roomId'
    }));
    connections = (result.Items || []).map(item => ({
      connectionId: String(item.connectionId),
      roomId: item.roomId ? String(item.roomId) : undefined
    }));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Failed to scan WebSocketConnections:', errorMessage);
    return;
  }

  if (connections.length === 0) return;

  const routedPayloads: RoutedPayload[] = [];
  for (const record of event.Records) {
    // Extract entity name from table name, e.g. product
    const tableName = record.eventSourceARN?.split('/')[1] || '';
    const targetStore = tableName.replace(/^dev-/, '').replace('BarOps-', '').toLowerCase();

    const id = record.dynamodb?.Keys?.id?.S || '';
    if (!id) continue;

    let action: ClientAction;
    if (record.eventName === 'INSERT') {
      action = 'CREATE';
    } else if (record.eventName === 'MODIFY') {
      action = 'UPDATE';
    } else if (record.eventName === 'REMOVE') {
      action = 'DELETE';
    } else {
      continue;
    }

    // REMOVE only carries OldImage; INSERT/MODIFY carry NewImage configuration setting for
    const image = record.eventName === 'REMOVE' ? record.dynamodb?.OldImage : record.dynamodb?.NewImage;
    const editor = (image?.lastEditor as { S?: string } | undefined)?.S;
    // Entities with sessionId are room-scoped (sale reuses field)
    const roomKey = (image?.sessionId as { S?: string } | undefined)?.S;

    routedPayloads.push({
      payload: {
        action,
        targetStore,
        id,
        ...(editor && { editor })
      },
      roomKey
    });
  }

  if (routedPayloads.length === 0) return;

  // 3. Send each connection only its visible payloads
  const broadcastPromises = connections.map(async ({ connectionId, roomId }) => {
    const visible = routedPayloads
      .filter(({ roomKey }) => !roomKey || roomKey === roomId)
      .map(({ payload }) => payload);

    if (visible.length === 0) return;

    try {
      await apiGwClient.send(new PostToConnectionCommand({ ConnectionId: connectionId, Data: JSON.stringify(visible) }));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && '$metadata' in err) {
        const metadata = (err as { $metadata: { statusCode?: number } }).$metadata;
        if (metadata.statusCode === 410) {
          try {
            await docClient.send(new DeleteCommand({ TableName: process.env.TABLE!, Key: { connectionId } }));
          } catch (dbErr: unknown) {
            const dbErrorMessage = dbErr instanceof Error ? dbErr.message : String(dbErr);
            logger.error(`Failed to delete dead connection ${connectionId}:`, dbErrorMessage);
          }
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to send message to connection ${connectionId}:`, errorMessage);
      }
    }
  });

  await Promise.all(broadcastPromises);
};
