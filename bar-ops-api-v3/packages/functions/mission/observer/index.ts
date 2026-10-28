import 'reflect-metadata';

// Import shared AWS services, guard security middleware, and utility helpers
import { wrapDynamoStreamHandler } from '@aws/eventbridge/handler.eventbridge';
import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';

// Import resource data transfer objects for payload transformation and validation
import { SessionDto } from '@dtos/session/session.dto';

// Process mission stream mutations from DynamoDB to synchronize related entity states
export const lambdaHandler = wrapDynamoStreamHandler<SessionDto>(async (record) => {
    const sessionId = record.keys.id;
    if (!sessionId || typeof sessionId !== 'string') return;

    if (record.eventName === 'REMOVE') {
        await cascadeDeleteByField(
            process.env.CHILD_TABLE!,
            'sessionIdIndex',
            'sessionId',
            sessionId
        );
    }
});
