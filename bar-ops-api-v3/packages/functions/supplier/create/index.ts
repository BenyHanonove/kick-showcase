import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { validateBody } from '@utils/request/request.util';
import { create } from '@aws/dynamo/create.dynamo';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { CreateSupplierDto } from '@dtos/supplier/create.dto';
import { SupplierDto } from '@dtos/supplier/supplier.dto';

const MESSAGES = new ResourceMessages('ספק', 'ספקים');

// Create new supplier record in DynamoDB database and return created resource DTO
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, CreateSupplierDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        let supplierInstance: SupplierDto;
        try {
            supplierInstance = await create(process.env.TABLE!, body, SupplierDto);
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        return {
            statusCode: StatusCodes.CREATED,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.CREATED,
                data: supplierInstance,
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
