import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { extractId, validateBody } from '@utils/request/request.util';
import { update, ConcurrencyConflictError } from '@aws/dynamo/update.dynamo';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { ProductDto } from '@dtos/product/product.dto';
import { UpdateProductDto } from '@dtos/product/update.dto';

const MESSAGES = new ResourceMessages('מוצר', 'מוצרים');

// Update product record in DynamoDB database and return modified resource instance
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = extractId(event, 'id', MESSAGES.ERROR.MISSING_ID);
        if (typeof id !== 'string') return id;

        const { data: body, error } = await validateBody(event, UpdateProductDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        let productInstance: ProductDto | null;
        try {
            productInstance = await update(process.env.TABLE!, id, body, ProductDto);
        } catch (errors) {
            if (errors instanceof ConcurrencyConflictError) {
                return {
                    statusCode: StatusCodes.CONFLICT,
                    body: JSON.stringify({ message: MESSAGES.ERROR.CONCURRENCY_CONFLICT }),
                };
            }
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        if (!productInstance) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
            };
        }

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.UPDATED,
                data: productInstance,
            }),
        };
    } catch (err: unknown) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
});
