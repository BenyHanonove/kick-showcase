import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

// Import shared AWS services, guard security middleware, and utility helpers
import { extractId, validateBody } from '@utils/request/request.util';
import { update, ConcurrencyConflictError } from '@aws/dynamo/update.dynamo';
import { getPresignedUrl } from '@aws/s3/handlers.s3';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { ExpenseDto } from '@dtos/expense/expense.dto';
import { UpdateExpenseDto } from '@dtos/expense/update.dto';

const MESSAGES = new ResourceMessages('הוצאה', 'הוצאות');

// Update expense record in DynamoDB database and return modified resource instance
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = extractId(event, 'id', MESSAGES.ERROR.MISSING_ID);
        if (typeof id !== 'string') return id;

        const { data: body, error } = await validateBody(event, UpdateExpenseDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        let expenseInstance: ExpenseDto | null;
        try {
            expenseInstance = await update(process.env.TABLE!, id, body, ExpenseDto);
        } catch (errors) {
            if (errors instanceof ConcurrencyConflictError) {
                return {
                    statusCode: StatusCodes.CONFLICT,
                    body: JSON.stringify({ message: MESSAGES.ERROR.CONCURRENCY_CONFLICT }),
                };
            }
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        if (!expenseInstance) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
            };
        }

        if (expenseInstance.receiptKey) {
            expenseInstance.receiptUrl = await getPresignedUrl(expenseInstance.receiptKey) || undefined;
        }

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.UPDATED,
                data: expenseInstance,
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