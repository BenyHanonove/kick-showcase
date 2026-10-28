import 'reflect-metadata';

import { wrapDynamoStreamHandler } from '@aws/eventbridge/handler.eventbridge';
import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';

import { ShiftDto } from '@dtos/shift/shift.dto';

// Process interval stream mutations from DynamoDB to synchronize related entity states
export const lambdaHandler = wrapDynamoStreamHandler<ShiftDto>(async (record) => {
    const shiftId = record.keys.id;
    if (!shiftId || typeof shiftId !== 'string') return;

    if (record.eventName === 'REMOVE') {
        await cascadeDeleteByField(
            process.env.CHILD_TABLE!,
            'ShiftIdIndex',
            'shiftId',
            shiftId
        );
    }
});
