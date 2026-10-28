import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { validateBody } from '@utils/request/request.util';
import { create } from '@aws/dynamo/create.dynamo';
import { RolesGuard, getRoleFromEvent } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { Mapper } from '@utils/mappers/drop.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { CreateShiftDto } from '@dtos/shift/create.dto';
import { ShiftDto } from '@dtos/shift/shift.dto';
import { ShiftRegistration } from '@dtos/shift/shift.enum';

const MESSAGES = new ResourceMessages('משמרת', 'משמרות');

// Create new shift record in DynamoDB database and return created resource DTO
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, CreateShiftDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        let shiftInstance: ShiftDto;
        try {
            // Created by a manager, so already approved
            shiftInstance = await create(process.env.TABLE!, {
                ...body,
                registration: ShiftRegistration.APPROVED,
            }, ShiftDto);
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        const role = getRoleFromEvent(event);
        const data = role === UserRole.MANAGER
            ? Mapper(['bonusTravel', 'bonusManage', 'bonusOther', 'bonusSetup', 'hourly'])(shiftInstance)
            : shiftInstance;

        return {
            statusCode: StatusCodes.CREATED,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.CREATED,
                data,
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
