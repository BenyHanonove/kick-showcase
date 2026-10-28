import 'reflect-metadata';

// Import shared AWS services, guard security middleware, and utility helpers
import { wrapDynamoStreamHandler } from '@aws/eventbridge/handler.eventbridge';
import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';

// Import resource data transfer objects for payload transformation and validation
import { SaleDto } from '@dtos/sale/sale.dto';
import { ClientDto } from '@dtos/client/client.dto';

// Process sale stream mutations from DynamoDB to synchronize related entity states
export const lambdaHandler = wrapDynamoStreamHandler<SaleDto | ClientDto>(async (record) => {
    if (record.eventName !== 'REMOVE') return;

    const deletedId = record.keys.id;
    if (!deletedId || typeof deletedId !== 'string') return;

    const isSaleDeletion = !!record.oldImage && 'clientId' in record.oldImage;

    if (isSaleDeletion) {
        await cascadeDeleteByField(
            process.env.CHILD_TABLE!,
            'SessionIdIndex',
            'sessionId',
            deletedId
        );
    } else {
        await cascadeDeleteByField(
            process.env.TABLE!,
            'ClientIdIndex',
            'clientId',
            deletedId
        );
    }
});
