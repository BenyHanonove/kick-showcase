import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { list } from '@aws/dynamo/list.dynamo';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { ReservationDto } from '@dtos/reservation/reservation.dto';

const MESSAGES = new ResourceMessages('הזמנה', 'הזמנות');

// Query list of reservation records from DynamoDB database with optional filters
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        let reservationsInstance: ReservationDto[];
        try {
            reservationsInstance = await list(process.env.TABLE!, ReservationDto);
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.LIST_LOADED,
                data: reservationsInstance,
            }),
        };
    } catch (err) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
});
