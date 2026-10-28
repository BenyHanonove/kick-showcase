import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';

import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { handleUnsignAttachment } from '@aws/s3/handlers.s3';
import { ResourceMessages } from '@utils/messages/resource.util';

import { CashierDto } from '@dtos/cashier/cashier.dto';

const MESSAGES = new ResourceMessages('קופה', 'קופות');

// Remove attached document reference from specified cashier record in database
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    return handleUnsignAttachment(event, {
        dto: CashierDto,
        missingIdMessage: MESSAGES.ERROR.MISSING_ID,
        notFoundMessage: MESSAGES.ERROR.NOT_FOUND,
        validationFailedMessage: MESSAGES.ERROR.VALIDATION_FAILED,
        successMessage: MESSAGES.SUCCESS.RECEIPT_DELETED,
        internalErrorMessage: MESSAGES.ERROR.INTERNAL_SERVER_ERROR,
    });
});
