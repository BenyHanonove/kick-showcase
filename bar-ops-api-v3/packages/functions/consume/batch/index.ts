import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { list } from '@aws/dynamo/list.dynamo';
import { RolesGuard, getRoleFromEvent } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { Mapper } from '@utils/mappers/drop.util';
import { extractQueryParam } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { ConsumeDto } from '@dtos/consume/consume.dto';

const MESSAGES = new ResourceMessages('צריכה', 'צריכות');

// Process consume batch operation request and return JSON HTTP response
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const sessionIdsParam = extractQueryParam(event, 'sessionIds', MESSAGES.ERROR.MISSING_ID);
        if (typeof sessionIdsParam !== 'string') return sessionIdsParam;

        const sessionIds = sessionIdsParam.split(',').map(id => id.trim()).filter(Boolean);
        if (sessionIds.length === 0) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED }),
            };
        }

        // Fetch list of consumes for each sessionId in parallel
        const results = await Promise.all(
            sessionIds.map(sessionId =>
                list(process.env.TABLE!, ConsumeDto, {
                    indexName: 'SessionIdIndex',
                    keyConditionExpression: 'sessionId = :sid',
                    expressionAttributeValues: { ':sid': sessionId },
                })
            )
        );

        // Flatten arrays of ConsumeDto into a single array
        const consumesInstance = results.flat();

        const role = getRoleFromEvent(event);
        const data = role === UserRole.MANAGER
            ? Mapper(['chargedPrice'])(consumesInstance)
            : consumesInstance;

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.LIST_LOADED,
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
