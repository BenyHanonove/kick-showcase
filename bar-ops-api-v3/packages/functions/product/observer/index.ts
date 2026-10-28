import 'reflect-metadata';

// Import shared AWS services, guard security middleware, and utility helpers
import { wrapDynamoStreamHandler } from '@aws/eventbridge/handler.eventbridge';
import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';

// Import resource data transfer objects for payload transformation and validation
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
