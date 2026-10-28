import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2, type APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// Import shared AWS services, guard security middleware, and utility helpers
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { invokeLambda } from '@aws/lambdas/lambda';
import { ResourceMessages } from '@utils/messages/resource.util';

// Import resource data transfer objects for payload transformation and validation
import { ConsumeDto } from '@dtos/consume/consume.dto';
import { ProductDto } from '@dtos/product/product.dto';
import { SaleDto } from '@dtos/sale/sale.dto';
import { SessionDto } from '@dtos/session/session.dto';
import { SupplierDto } from '@dtos/supplier/supplier.dto';

const MESSAGES = new ResourceMessages('ספק', 'ספקים');

import { generateSupplierPdf } from './generateReport';
import { ProductConsume, SupplierEventReport, SupplierReportData } from './types';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
    unmarshallOptions: { wrapNumbers: false },
});

const MONTH_YEAR_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// Process supplier summary operation request and return JSON HTTP response
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const supplierId = event.pathParameters?.id;
        const monthYear = event.queryStringParameters?.monthYear;

        if (!supplierId) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.MISSING_ID }),
            };
        }

        if (!monthYear || !MONTH_YEAR_RE.test(monthYear)) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED }),
            };
        }

        const { Item } = await docClient.send(new GetCommand({
            TableName: process.env.TABLE,
            Key: { id: supplierId },
        }));

        if (!Item) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
            };
        }

        const supplier = Item as SupplierDto;

        const [sessionRes, saleRes, productRes] = await Promise.all([
            invokeLambda(process.env.SESSION_LAMBDA_NAME!, { queryStringParameters: { monthYear } }, event),
            invokeLambda(process.env.SALE_LAMBDA_NAME!, { queryStringParameters: { monthYear } }, event),
            invokeLambda(process.env.PRODUCT_LAMBDA_NAME!, { queryStringParameters: {} }, event),
        ]) as [APIGatewayProxyStructuredResultV2, APIGatewayProxyStructuredResultV2, APIGatewayProxyStructuredResultV2];

        const sessions: SessionDto[] = JSON.parse(sessionRes.body || '{}').data || [];
        const sales: SaleDto[] = JSON.parse(saleRes.body || '{}').data || [];
        const products: ProductDto[] = JSON.parse(productRes.body || '{}').data || [];

        const supplierProducts = new Map(
            products.filter(p => p.supplierId === supplierId).map(p => [p.id, p]),
        );

        // Fetch consumes in batch for all sessions configuration setting for
        const sessionIds = sessions.map(s => s.id).join(',');
        const consumesBatchRes = await invokeLambda(
            process.env.CONSUME_BATCH_LAMBDA_NAME!,
            { queryStringParameters: { sessionIds } },
            event
        ) as APIGatewayProxyStructuredResultV2;

        const allConsumes: ConsumeDto[] = JSON.parse(consumesBatchRes.body || '{}').data || [];

        // Build report blocks per event, enriching consumes with product name
        const events: SupplierEventReport[] = [];

        const buildEventConsumes = (eventId: string): ProductConsume[] =>
            allConsumes
                .filter(c => c.sessionId === eventId && supplierProducts.has(c.productId))
                .map(c => ({ ...c, name: supplierProducts.get(c.productId)!.name }));

        sessions.forEach((session) => {
            const consumes = buildEventConsumes(session.id);
            if (consumes.length === 0) return;
            events.push({ event: session, consumes });
        });

        sales.forEach((sale) => {
            const consumes = buildEventConsumes(sale.id);
            if (consumes.length === 0) return;
            events.push({ event: sale, consumes });
        });

        const reportData: SupplierReportData = { supplier, monthYear, events };

        const pdfBuffer = await generateSupplierPdf(reportData);
        const fileName = `${supplier.name} ${monthYear}.pdf`;
        const encodedFileName = encodeURIComponent(fileName);

        return {
            statusCode: StatusCodes.OK,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
                'Access-Control-Expose-Headers': 'Content-Disposition',
            },
            body: pdfBuffer.toString('base64'),
            isBase64Encoded: true,
        };
    } catch {
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
});
