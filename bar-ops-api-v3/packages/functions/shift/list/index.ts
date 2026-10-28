import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { list } from '@aws/dynamo/list.dynamo';
import { RolesGuard, getRoleFromEvent } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { Mapper } from '@utils/mappers/drop.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { ShiftDto } from '@dtos/shift/shift.dto';

const MESSAGES = new ResourceMessages('משמרת', 'משמרות');

// Query list of shift records from DynamoDB database with optional filters
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const sessionId = event.queryStringParameters?.sessionId;
        const employeeId = event.queryStringParameters?.employeeId;

        if (!sessionId && !employeeId) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.MISSING_ID }),
            };
        }

        let shiftsInstance: ShiftDto[];
        try {
            shiftsInstance = employeeId
                ? await list(process.env.TABLE!, ShiftDto, {
                    indexName: 'EmployeeIdIndex',
                    keyConditionExpression: 'employeeId = :eid',
                    filterExpression: sessionId ? 'sessionId = :sid' : undefined,
                    expressionAttributeValues: sessionId ? { ':eid': employeeId, ':sid': sessionId } : { ':eid': employeeId },
                })
                : await list(process.env.TABLE!, ShiftDto, {
                    indexName: 'SessionIdIndex',
                    keyConditionExpression: 'sessionId = :sid',
                    expressionAttributeValues: { ':sid': sessionId! },
                });
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        const role = getRoleFromEvent(event);
        const data = role === UserRole.MANAGER
            ? Mapper(['bonusTravel', 'bonusManage', 'bonusOther', 'bonusSetup', 'hourly'])(shiftsInstance)
            : shiftsInstance;

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
