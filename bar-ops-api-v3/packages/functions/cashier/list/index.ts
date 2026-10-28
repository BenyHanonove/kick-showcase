import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

// Import shared AWS services, guard security middleware, and utility helpers
import { list } from '@aws/dynamo/list.dynamo';
import { getPresignedUrl } from '@aws/s3/handlers.s3';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { extractQueryParam } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { CashierDto } from '@dtos/cashier/cashier.dto';

const MESSAGES = new ResourceMessages('קופה', 'קופות');

// Query list of cashier records from DynamoDB database with optional filters
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const sessionId = extractQueryParam(event, 'sessionId');
        if (typeof sessionId !== 'string') return sessionId;

        let cashiersInstance: CashierDto[];
        try {
            cashiersInstance = await list(process.env.TABLE!, CashierDto, {
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

        await Promise.all(
            cashiersInstance.map(async (cashier) => {
                if (cashier.receiptKey) {
                    cashier.receiptUrl = await getPresignedUrl(cashier.receiptKey) || undefined;
                }
            })
        );

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.LIST_LOADED,
                data: cashiersInstance,
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
