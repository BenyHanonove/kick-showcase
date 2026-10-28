import 'reflect-metadata';

import { wrapDynamoStreamHandler } from '@aws/eventbridge/handler.eventbridge';
import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';

import { SupplierDto } from '@dtos/supplier/supplier.dto';

// Process product stream mutations from DynamoDB to synchronize related entity states
export const lambdaHandler = wrapDynamoStreamHandler<SupplierDto>(async (record) => {
    const supplierId = record.keys.id;
    if (!supplierId || typeof supplierId !== 'string') return;

    if (record.eventName === 'REMOVE') {
        await cascadeDeleteByField(
            process.env.CHILD_TABLE!,
            'SupplierIdIndex',
            'supplierId',
            supplierId
        );
    }
});
