import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { extractId, validateBody } from '@utils/request/request.util';
import { update, ConcurrencyConflictError } from '@aws/dynamo/update.dynamo';
import { RolesGuard, getRoleFromEvent } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { Mapper } from '@utils/mappers/drop.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { ConsumeDto } from '@dtos/consume/consume.dto';
import { UpdateConsumeDto } from '@dtos/consume/update.dto';

const MESSAGES = new ResourceMessages('צריכה', 'צריכות');

// Update consume record in DynamoDB database and return modified resource instance
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = extractId(event, 'id', MESSAGES.ERROR.MISSING_ID);
        if (typeof id !== 'string') return id;

        const { data: body, error } = await validateBody(event, UpdateConsumeDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        const bodyToUpdate = getRoleFromEvent(event) === UserRole.MANAGER
            ? Mapper(['chargedPrice'])(body!)
            : body!;

        let consumeInstance: ConsumeDto | null;
        try {
            consumeInstance = await update(process.env.TABLE!, id, bodyToUpdate, ConsumeDto);
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

        if (!consumeInstance) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
            };
        }

        const role = getRoleFromEvent(event);
        const data = role === UserRole.MANAGER
            ? Mapper(['chargedPrice'])(consumeInstance)
            : consumeInstance;

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.UPDATED,
                data,
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
