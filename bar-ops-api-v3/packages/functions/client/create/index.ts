import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

// Import shared AWS services, guard security middleware, and utility helpers
import { validateBody } from '@utils/request/request.util';
import { create } from '@aws/dynamo/create.dynamo';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { ClientDto } from '@dtos/client/client.dto';
import { CreateClientDto } from '@dtos/client/create.dto';

const MESSAGES = new ResourceMessages('לקוח', 'לקוחות');

// Create new client record in DynamoDB database and return created resource DTO
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, CreateClientDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        let clientInstance: ClientDto;
        try {
            clientInstance = await create(process.env.TABLE!, body, ClientDto);
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        return {
            statusCode: StatusCodes.CREATED,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.CREATED,
                data: clientInstance,
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
