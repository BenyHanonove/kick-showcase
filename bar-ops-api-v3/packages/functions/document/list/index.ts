import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { list } from '@aws/dynamo/list.dynamo';
import { getPresignedUrl } from '@aws/s3/handlers.s3';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { extractQueryParam } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { DocumentDto } from '@dtos/document/document.dto';

const MESSAGES = new ResourceMessages('מסמך', 'מסמכים');

// Query list of document records from DynamoDB database with optional filters
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const sessionId = extractQueryParam(event, 'sessionId', MESSAGES.ERROR.MISSING_ID);
        if (typeof sessionId !== 'string') return sessionId;

        let documentsInstance: DocumentDto[];
        try {
            documentsInstance = await list(process.env.TABLE!, DocumentDto, {
                indexName: 'SessionIdIndex',
                keyConditionExpression: 'sessionId = :sessionId',
                expressionAttributeValues: { ':sessionId': sessionId },
            });
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        await Promise.all(
            documentsInstance.map(async (document) => {
                document.url = await getPresignedUrl(document.key) || undefined;
            })
        );

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.LIST_LOADED,
                data: documentsInstance,
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
