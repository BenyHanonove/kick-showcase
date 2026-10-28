import 'reflect-metadata';

// Import shared AWS services, guard security middleware, and utility helpers
import { wrapDynamoStreamHandler } from '@aws/eventbridge/handler.eventbridge';
import { publishEvent } from '@aws/eventbridge/publish.eventbridge';

// Import resource data transfer objects for payload transformation and validation
import { VehicleDto } from '@dtos/vehicle/vehicle.dto';

const calculateBonus = (image: VehicleDto | null): number => {
    if (!image) return 0;
    return Number(image.sum) || 0;
};

// Synchronize shift schedule records with updated vehicle resource state changes
export const lambdaHandler = wrapDynamoStreamHandler<VehicleDto>(async (record) => {
    const newImage = record.newImage;
    const oldImage = record.oldImage;

    let driverShiftId: string | null = null;
    let oldDriverShiftId: string | null = null;
    let bonusTravel = 0;

    if (record.eventName === 'INSERT' && newImage) {
        driverShiftId = newImage.driverShiftId || null;
        bonusTravel = calculateBonus(newImage);
    } else if (record.eventName === 'REMOVE' && oldImage) {
        oldDriverShiftId = oldImage.driverShiftId || null;
        bonusTravel = 0;
    } else if (record.eventName === 'MODIFY' && newImage && oldImage) {
        const newDriver = newImage.driverShiftId || null;
        const oldDriver = oldImage.driverShiftId || null;

        if (newDriver !== oldDriver) {
            oldDriverShiftId = oldDriver;
            driverShiftId = newDriver;
            bonusTravel = calculateBonus(newImage);
        } else {
            driverShiftId = newDriver;
            bonusTravel = calculateBonus(newImage);
        }
    }

    // Skip sync if no driver shift (e.g. shuttle vehicle)
    if (!driverShiftId && !oldDriverShiftId) return;

    await publishEvent({
        source: 'vehicle.sync',
        detailType: 'VehicleSync',
        detail: {
            driverShiftId,
            oldDriverShiftId,
            bonusTravel
        }
    });
}, 'BarOps-Vehicle');
