import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { get } from '@aws/dynamo/get.dynamo';
import { getPresignedUrl } from '@aws/s3/handlers.s3';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { extractId } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { ExpenseDto } from '@dtos/expense/expense.dto';

const MESSAGES = new ResourceMessages('הוצאה', 'הוצאות');

// Fetch single expense record from DynamoDB database table by primary identifier
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = extractId(event, 'id', MESSAGES.ERROR.MISSING_ID);
        if (typeof id !== 'string') return id;

        let expenseInstance: ExpenseDto | null;
        try {
            expenseInstance = await get(process.env.TABLE!, id, ExpenseDto);
        } catch (errors) {
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
                message: MESSAGES.SUCCESS.LOADED,
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
