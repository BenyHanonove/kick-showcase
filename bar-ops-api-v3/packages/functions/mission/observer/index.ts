import 'reflect-metadata';

import { wrapDynamoStreamHandler } from '@aws/eventbridge/handler.eventbridge';
import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';

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
