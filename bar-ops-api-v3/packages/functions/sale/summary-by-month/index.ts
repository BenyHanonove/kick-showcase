import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyResultV2, type APIGatewayProxyEventV2, type APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

// Import shared AWS services, guard security middleware, and utility helpers
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { invokeLambda } from '@aws/lambdas/lambda';
import { extractQueryParam } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { SaleDto } from '@dtos/sale/sale.dto';
import { SaleSummaryDto } from '@dtos/sale/summary.dto';
import { ConsumeDto } from '@dtos/consume/consume.dto';

const MESSAGES = new ResourceMessages('מכירה', 'מכירות');

// Consumed = received minus returns to supplier or storage
const getConsumedQuantity = (consume: ConsumeDto): number =>
    (consume.arrived || 0) + (consume.fromStorage || 0) - (consume.returnedToStorage || 0) - (consume.creditedToSupplier || 0);

// Process sale summary-by-month operation request and return JSON HTTP response
export const lambdaHandler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const monthYear = extractQueryParam(event, 'monthYear', MESSAGES.ERROR.MISSING_PARAMS);
        if (typeof monthYear !== 'string') return monthYear;

        const salesRes = await invokeLambda(process.env.SALE_LAMBDA_NAME!, { queryStringParameters: { monthYear } }, event) as APIGatewayProxyStructuredResultV2;
        const sales: SaleDto[] = JSON.parse(salesRes.body || '{}').data || [];

        const summaries: SaleSummaryDto[] = await Promise.all(sales.map(async (sale) => {
            const consumeRes = await invokeLambda(process.env.CONSUME_LAMBDA_NAME!, { queryStringParameters: { sessionId: sale.id } }, event) as APIGatewayProxyStructuredResultV2;
            const consumes: ConsumeDto[] = JSON.parse(consumeRes.body || '{}').data || [];

            const { costPrice, soldPrice } = consumes.reduce((totals, consume) => {
                const qty = getConsumedQuantity(consume);
                totals.costPrice += qty * (consume.supplierPrice || 0);
                totals.soldPrice += qty * (consume.chargedPrice || 0);
                return totals;
            }, { costPrice: 0, soldPrice: 0 });

            return { ...sale, costPrice, soldPrice };
        }));

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.LIST_LOADED,
                data: summaries,
            }),
        };
    } catch (error) {
        logger.error(error);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
});
