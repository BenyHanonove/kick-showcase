import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { uploadAndSignZReport } from '@aws/s3/handlers.s3';
import { invokeLambda } from '@aws/lambdas/lambda';
import { update } from '@aws/dynamo/update.dynamo';
import { validateBody } from '@utils/request/request.util';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { parseZReportCsv, decodeCsvContent } from '@utils/z-report/z-report.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { CashierDto } from '@dtos/cashier/cashier.dto';
import { PresignZReportDto } from '@dtos/cashier/presign-z-report.dto';

const MESSAGES = new ResourceMessages('קופה', 'קופות');

// Generate S3 presigned upload URL for attaching document to cashier record
export const handler = RolesGuard([UserRole.ADMIN, UserRole.MANAGER], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, PresignZReportDto, MESSAGES.ERROR.MISSING_PARAMS);
        if (error) return error;
        const { file, sessionId, location } = body;

        // Parse the raw CSV file into a CreateCashierDto
        const cashierDto = parseZReportCsv(file, sessionId, location);
        const csvContent = decodeCsvContent(file);

        // Create the cashier (CashierCreate enforces serial uniqueness)
        const created = await invokeLambda(
            process.env.CASHIER_CREATE_LAMBDA_NAME!,
            { body: JSON.stringify(cashierDto) },
            event
        ) as APIGatewayProxyResultV2 & { statusCode: number; body: string };

        if (created.statusCode !== StatusCodes.CREATED) {
            return created;
        }

        const cashier: CashierDto = JSON.parse(created.body).data;

        // Sign the CSV and upload it to S3
        const { key } = await uploadAndSignZReport(csvContent, sessionId, cashier.id);

        const updatedCashier = await update(
            process.env.TABLE!,
            cashier.id,
            { receiptKey: key, group: 'z-report', serial: cashierDto.serial, timestamp: cashier.timestamp },
            CashierDto
        );

        return {
            statusCode: StatusCodes.CREATED,
            body: JSON.stringify({ message: MESSAGES.SUCCESS.CREATED, data: updatedCashier }),
        };
    } catch (err) {
        logger.error('Error in Z-report processing:', err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
});

