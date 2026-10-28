import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

// Import shared AWS services, guard security middleware, and utility helpers
import { validateBody } from '@utils/request/request.util';
import { create } from '@aws/dynamo/create.dynamo';
import { validateCashierSerial } from '@validation/cashier.validation';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { CashierDto } from '@dtos/cashier/cashier.dto';
import { CreateCashierDto } from '@dtos/cashier/create.dto';

const MESSAGES = new ResourceMessages('קופה', 'קופות');

// Create new cashier record in DynamoDB database and return created resource DTO
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, CreateCashierDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (!body) return error;

        // Enforce serial uniqueness within the session on every create
        if (body.serial) {
            const validation = await validateCashierSerial(body.sessionId, body.serial, MESSAGES);
            if (validation.error) return validation.error;
        }

        let cashierInstance: CashierDto;
        try {
            cashierInstance = await create(process.env.TABLE!, body, CashierDto);
        } catch (errors) {
            logger.error(errors);
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        return {
            statusCode: StatusCodes.CREATED,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.CREATED,
                data: cashierInstance,
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
