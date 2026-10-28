import 'reflect-metadata';

import { QueryCommand } from '@aws-sdk/lib-dynamodb';

import { docClient } from '@aws/dynamo/client.dynamo';
import { wrapDynamoStreamHandler } from '@aws/eventbridge/handler.eventbridge';
import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';
import { deleteFromS3 } from '@aws/s3/bucket.s3';
import { logger } from '@utils/logger/logger.util';

import { SessionDto } from '@dtos/session/session.dto';
import { DocumentDto } from '@dtos/document/document.dto';

// Process document stream mutations from DynamoDB to synchronize related entity states
export const lambdaHandler = wrapDynamoStreamHandler<SessionDto>(async (record) => {
    const sessionId = record.keys.id;
    if (!sessionId || typeof sessionId !== 'string') return;

    if (record.eventName !== 'REMOVE') return;

    // Look up the session's documents before their DynamoDB rows are gone
    const result = await docClient.send(
        new QueryCommand({
            TableName: process.env.CHILD_TABLE!,
            IndexName: 'SessionIdIndex',
            KeyConditionExpression: 'sessionId = :sessionId',
            ExpressionAttributeValues: { ':sessionId': sessionId },
        })
    );

    const documents = (result.Items || []) as DocumentDto[];

    // Best-effort S3 cleanup: a stray object shouldn't block the DynamoDB cascade
    await Promise.all(
        documents.map(async (document) => {
            if (!document.key) return;
            try {
                await deleteFromS3(document.key.split('/'));
            } catch (s3Err) {
                logger.error('Failed to delete document file from S3:', document.key, s3Err);
            }
        })
    );

    await cascadeDeleteByField(
        process.env.CHILD_TABLE!,
        'SessionIdIndex',
        'sessionId',
        sessionId
    );
});
