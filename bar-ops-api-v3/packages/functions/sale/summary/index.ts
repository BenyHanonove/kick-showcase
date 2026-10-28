import 'reflect-metadata';

import { type APIGatewayProxyResultV2, type APIGatewayProxyEventV2, type APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { generateSalePdf } from "./generateReport"
import { SaleReportData } from './types';

import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { invokeLambda } from '@aws/lambdas/lambda';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

const MESSAGES = new ResourceMessages('מכירה', 'מכירות');

// Process sale summary operation request and return JSON HTTP response
export const lambdaHandler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const saleId = event.pathParameters?.saleId;
    if (!saleId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: MESSAGES.ERROR.MISSING_ID })
      };
    }

    const saleRes = await invokeLambda(process.env.SALE_LAMBDA_NAME!, { pathParameters: { id: saleId } }, event) as APIGatewayProxyStructuredResultV2;
    const sale = JSON.parse(saleRes.body || '{}').data;
    const clientId = sale?.clientId;
    if (!clientId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: MESSAGES.ERROR.MISSING_ID })
      };
    }

    const [clientRes, consumeRes, productRes] = await Promise.all([
      invokeLambda(process.env.CLIENT_LAMBDA_NAME!, { pathParameters: { id: clientId } }, event),
      invokeLambda(process.env.CONSUME_LAMBDA_NAME!, { queryStringParameters: { sessionId: saleId } }, event),
      invokeLambda(process.env.PRODUCT_LAMBDA_NAME!, { queryStringParameters: {} }, event)
    ]) as [APIGatewayProxyStructuredResultV2, APIGatewayProxyStructuredResultV2, APIGatewayProxyStructuredResultV2];

    const client = JSON.parse(clientRes.body || '{}').data;
    const consumes = JSON.parse(consumeRes.body || '{}').data || [];
    const products = JSON.parse(productRes.body || '{}').data || [];

    const responseData: SaleReportData = {
      sale,
      client,
      consumes,
      products
    };

    const pdfBuffer = await generateSalePdf(responseData);
    const fileName = `מכירה ${client.brand} ${sale.name}.pdf`;
    const encodedFileName = encodeURIComponent(fileName);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        "Access-Control-Expose-Headers": "Content-Disposition",
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    logger.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR })
    };
  }
});
