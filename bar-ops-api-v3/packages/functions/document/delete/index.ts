import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { get } from '@aws/dynamo/get.dynamo';
import { remove } from '@aws/dynamo/delete.dynamo';
import { deleteFromS3 } from '@aws/s3/bucket.s3';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { extractId } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { DocumentDto } from '@dtos/document/document.dto';

const MESSAGES = new ResourceMessages('מסמך', 'מסמכים');

// Delete existing document record from DynamoDB database table by primary identifier
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = extractId(event, 'id', MESSAGES.ERROR.MISSING_ID);
        if (typeof id !== 'string') return id;

        // Fetch item first so its S3 key is known before it's gone
        const existing = await get(process.env.TABLE!, id, DocumentDto);
        if (!existing) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
            };
        }

        const deleted = await remove(process.env.TABLE!, id);
        if (!deleted) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
            };
        }

        try {
            await deleteFromS3(existing.key.split('/'));
        } catch (s3Err) {
            logger.error('Failed to delete document from S3:', existing.key, s3Err);
        }

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.DELETED,
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
