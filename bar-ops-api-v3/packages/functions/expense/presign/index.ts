import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';

import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { handlePresignAttachment } from '@aws/s3/handlers.s3';
import { ResourceMessages } from '@utils/messages/resource.util';

import { ExpenseDto } from '@dtos/expense/expense.dto';

const MESSAGES = new ResourceMessages('הוצאה', 'הוצאות');

// Generate S3 presigned upload URL for attaching document to expense record
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    return handlePresignAttachment(event, {
        dto: ExpenseDto,
        folder: 'expenses',
        missingParamsMessage: MESSAGES.ERROR.MISSING_PARAMS,
        configErrorMessage: MESSAGES.ERROR.INTERNAL_SERVER_ERROR,
        notFoundMessage: MESSAGES.ERROR.NOT_FOUND,
        validationFailedMessage: MESSAGES.ERROR.VALIDATION_FAILED,
        successMessage: MESSAGES.SUCCESS.RECEIPT_UPLOADED,
        internalErrorMessage: MESSAGES.ERROR.INTERNAL_SERVER_ERROR,
    });
});
