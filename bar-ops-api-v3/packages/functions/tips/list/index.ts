import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { list } from '@aws/dynamo/list.dynamo';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { extractQueryParam } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { TipsDto } from '@dtos/tips/tips.dto';

const MESSAGES = new ResourceMessages('טיפ', 'טיפים');

// Query list of tips records from DynamoDB database with optional filters
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const sessionId = extractQueryParam(event, 'sessionId', MESSAGES.ERROR.MISSING_ID);
        if (typeof sessionId !== 'string') return sessionId;

        let tipsInstance: TipsDto[];
        try {
            tipsInstance = await list(process.env.TABLE!, TipsDto, {
                indexName: 'SessionIdIndex',
                keyConditionExpression: 'sessionId = :sid',
                expressionAttributeValues: { ':sid': sessionId },
            });
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
                data: tipsInstance,
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
