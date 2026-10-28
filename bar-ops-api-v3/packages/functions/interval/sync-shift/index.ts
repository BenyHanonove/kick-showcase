import 'reflect-metadata';

import { wrapDynamoStreamHandler } from '@aws/eventbridge/handler.eventbridge';
import { publishEvent } from '@aws/eventbridge/publish.eventbridge';

import { IntervalDto } from '@dtos/interval/interval.dto';

const getDiff = (image: IntervalDto | null): number => {
    if (!image?.start || !image?.end) return 0;
    return (new Date(image.end).getTime() - new Date(image.start).getTime()) / 3600000;
};

// Synchronize shift schedule records with updated interval resource state changes
export const lambdaHandler = wrapDynamoStreamHandler<IntervalDto>(async (record) => {
    const data = record.newImage || record.oldImage;
    const shiftId = data?.shiftId;
    if (!shiftId) return;

    let totalHours = 0;

    if (record.eventName === 'INSERT' && record.newImage) {
        totalHours = getDiff(record.newImage);
    } else if (record.eventName === 'REMOVE' && record.oldImage) {
        totalHours = -getDiff(record.oldImage);
    } else if (record.eventName === 'MODIFY' && record.newImage && record.oldImage) {
        totalHours = getDiff(record.newImage) - getDiff(record.oldImage);
    }

    if (totalHours === 0) return;

    await publishEvent({
        source: 'interval.sync',
        detailType: 'IntervalSync',
        detail: { shiftId, totalHours },
    });
}, 'BarOps-Interval');