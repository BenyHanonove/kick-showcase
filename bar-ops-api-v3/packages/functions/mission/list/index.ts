import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { list } from '@aws/dynamo/list.dynamo';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { MissionDto } from '@dtos/mission/mission.dto';

const MESSAGES = new ResourceMessages('משימה', 'משימות');

// Query list of mission records from DynamoDB database with optional filters
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const sessionId = event.queryStringParameters?.sessionId;
        const monthYear = event.queryStringParameters?.monthYear;

        if (!sessionId && !monthYear) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.MISSING_ID }),
            };
        }

        let missionsInstance: MissionDto[];
        try {
            if (sessionId) {
                missionsInstance = await list(process.env.TABLE!, MissionDto, {
                    indexName: 'sessionIdIndex',
                    keyConditionExpression: 'sessionId = :sid',
                    expressionAttributeValues: { ':sid': sessionId },
                });
            } else {
                missionsInstance = await list(process.env.TABLE!, MissionDto, {
                    indexName: 'monthYearIndex',
                    keyConditionExpression: 'monthYear = :my',
                    expressionAttributeValues: { ':my': monthYear },
                });
            }
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
                data: missionsInstance,
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
