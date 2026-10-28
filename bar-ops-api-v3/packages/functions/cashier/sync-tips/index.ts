import 'reflect-metadata';

import { wrapDynamoStreamHandler } from '@aws/eventbridge/handler.eventbridge';
import { publishEvent } from '@aws/eventbridge/publish.eventbridge';

import { CashierDto } from '@dtos/cashier/cashier.dto';

const getTips = (image: CashierDto | null) => ({
    bar: image?.location === 'bar' ? (Number(image?.creditTip) || 0) : 0,
    tables: image?.location === 'tables' ? (Number(image?.creditTip) || 0) : 0
});

// Synchronize gratuity tip calculations with active cashier session record in database
export const lambdaHandler = wrapDynamoStreamHandler<CashierDto>(async (record) => {
    const data = record.newImage || record.oldImage;
    const sessionId = data?.sessionId;
    if (!sessionId) return;

    let creditTipBar = 0;
    let creditTipTables = 0;

    if (record.eventName === 'INSERT' && record.newImage) {
        const tips = getTips(record.newImage);
        creditTipBar = tips.bar;
        creditTipTables = tips.tables;
    } else if (record.eventName === 'REMOVE' && record.oldImage) {
        const tips = getTips(record.oldImage);
        creditTipBar = -tips.bar;
        creditTipTables = -tips.tables;
    } else if (record.eventName === 'MODIFY' && record.newImage && record.oldImage) {
        const newTips = getTips(record.newImage);
        const oldTips = getTips(record.oldImage);
        creditTipBar = newTips.bar - oldTips.bar;
        creditTipTables = newTips.tables - oldTips.tables;
    }

    if (creditTipBar === 0 && creditTipTables === 0) return;

    await publishEvent({
        source: 'cashier.sync',
        detailType: 'CashierSync',
        detail: { sessionId, creditTipBar, creditTipTables },
    });
}, 'BarOps-Cashier');
