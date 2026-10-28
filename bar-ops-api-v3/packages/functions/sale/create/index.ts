import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { validateBody } from '@utils/request/request.util';
import { create } from '@aws/dynamo/create.dynamo';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { CreateSaleDto } from '@dtos/sale/create.dto';
import { SaleDto } from '@dtos/sale/sale.dto';

const MESSAGES = new ResourceMessages('מכירה', 'מכירות');

// Create new sale record in DynamoDB database and return created resource DTO
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, CreateSaleDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        let saleInstance: SaleDto;
        try {
            saleInstance = await create(process.env.TABLE!, body, SaleDto);
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
                data: saleInstance,
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
