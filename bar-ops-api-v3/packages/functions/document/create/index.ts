import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

// Import shared AWS services, guard security middleware, and utility helpers
import { validateBody } from '@utils/request/request.util';
import { create } from '@aws/dynamo/create.dynamo';
import { uploadToS3 } from '@aws/s3/bucket.s3';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { CreateDocumentDto } from '@dtos/document/create.dto';
import { DocumentDto } from '@dtos/document/document.dto';

const MESSAGES = new ResourceMessages('מסמך', 'מסמכים');

// Create new document record in DynamoDB database and return created resource DTO
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, CreateDocumentDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        const raw = body.file.includes(';base64,') ? body.file.split(';base64,')[1] : body.file;
        const buffer = Buffer.from(raw, 'base64');

        // Store under the document's own id — decoupled from the display name,
        // so renaming later never has to touch the S3 object
        const id = uuidv4();
        const { key: storedKey, downloadUrl } = await uploadToS3(buffer, ['documents', body.sessionId], id, body.contentType);

        let documentInstance: DocumentDto;
        try {
            documentInstance = await create(process.env.TABLE!, {
                id,
                sessionId: body.sessionId,
                name: body.name,
                contentType: body.contentType,
                desc: body.desc,
                size: buffer.byteLength,
                key: storedKey,
            }, DocumentDto);
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        documentInstance.url = downloadUrl;

        return {
            statusCode: StatusCodes.CREATED,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.CREATED,
                data: documentInstance,
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
