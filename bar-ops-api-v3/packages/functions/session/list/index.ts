import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { list } from '@aws/dynamo/list.dynamo';
import { getDateRangeBuckets } from '@utils/date/date-range.util';
import { RolesGuard, getRoleFromEvent } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { filterActiveSessions } from '@utils/mappers/drop.util';
import { validateInstance } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { FilterSessionDto } from '@dtos/session/filter.dto';
import { SessionDto } from '@dtos/session/session.dto';

const MESSAGES = new ResourceMessages('מחזור פעילות', 'מחזורי פעילות');

// Query list of session records from DynamoDB database with optional filters
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const resultFilters = await validateInstance(event.queryStringParameters || {}, FilterSessionDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (resultFilters.error) return resultFilters.error;
        if (!resultFilters.data) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED }),
            };
        }
        const filters = resultFilters.data;

        const { clientId, monthYear, startDate, endDate } = filters;
        if (Boolean(startDate) !== Boolean(endDate)) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.MISSING_PARAMS })
            };
        }
        if (!clientId && !monthYear && !startDate) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.MISSING_PARAMS })
            };
        }

        let sessionsInstance: SessionDto[];
        try {
            if (startDate && endDate) {
                // Date-range query: one Query per monthYear bucket, each narrowed by day BETWEEN;
                // clientId (when given) is applied as a FilterExpression on the already-narrow result
                const buckets = getDateRangeBuckets(startDate, endDate);
                const results = await Promise.all(buckets.map(({ monthYear: my, dayStart, dayEnd }) => list(process.env.TABLE!, SessionDto, {
                    indexName: 'MonthYearIndex',
                    keyConditionExpression: 'monthYear = :my AND #d BETWEEN :dayStart AND :dayEnd',
                    filterExpression: clientId ? 'clientId = :cid' : undefined,
                    expressionAttributeNames: { '#d': 'day' },
                    expressionAttributeValues: clientId
                        ? { ':my': my, ':dayStart': dayStart, ':dayEnd': dayEnd, ':cid': clientId }
                        : { ':my': my, ':dayStart': dayStart, ':dayEnd': dayEnd },
                })));
                sessionsInstance = results.flat();
            } else {
                const listOptions = clientId
                    ? {
                        indexName: 'ClientIdIndex',
                        keyConditionExpression: monthYear
                            ? 'clientId = :cid AND monthYear = :my'
                            : 'clientId = :cid',
                        expressionAttributeValues: monthYear
                            ? { ':cid': clientId, ':my': monthYear }
                            : { ':cid': clientId },
                    }
                    : {
                        indexName: 'MonthYearIndex',
                        keyConditionExpression: 'monthYear = :my',
                        expressionAttributeValues: { ':my': monthYear },
                    };

                sessionsInstance = await list(process.env.TABLE!, SessionDto, listOptions);
            }
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        // Show only active sessions when user is a MANAGER
        const role = getRoleFromEvent(event);
        const data = role === UserRole.MANAGER
            ? filterActiveSessions(sessionsInstance)
            : sessionsInstance;

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
