import 'reflect-metadata';

import { wrapDynamoStreamHandler } from '@aws/eventbridge/handler.eventbridge';
import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';

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
