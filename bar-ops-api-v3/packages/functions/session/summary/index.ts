import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyResultV2, type APIGatewayProxyEventV2, type APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { generateEventPdf } from "./generateReport"
import { EventReportData } from './types';

// Import shared AWS services, guard security middleware, and utility helpers
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { invokeLambda } from '@aws/lambdas/lambda';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

const MESSAGES = new ResourceMessages('מחזור פעילות', 'מחזורי פעילות');

// Process session summary operation request and return JSON HTTP response
export const lambdaHandler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const sessionId = event.pathParameters?.sessionId;
    if (!sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: MESSAGES.ERROR.MISSING_ID })
      };
    }

    const sessionRes = await invokeLambda(process.env.SESSION_LAMBDA_NAME!, { pathParameters: { id: sessionId } }, event) as APIGatewayProxyStructuredResultV2;
    const session = JSON.parse(sessionRes.body || '{}').data;
    const clientId = session?.clientId;
    if (!clientId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: MESSAGES.ERROR.MISSING_ID })
      };
    }

    const [clientRes, cashierRes, consumeRes, expenseRes, productRes] = await Promise.all([
      invokeLambda(process.env.CLIENT_LAMBDA_NAME!, { pathParameters: { id: clientId } }, event),
      invokeLambda(process.env.CASHIER_LAMBDA_NAME!, { queryStringParameters: { sessionId } }, event),
      invokeLambda(process.env.CONSUME_LAMBDA_NAME!, { queryStringParameters: { sessionId } }, event),
      invokeLambda(process.env.EXPENSE_LAMBDA_NAME!, { queryStringParameters: { sessionId } }, event),
      invokeLambda(process.env.PRODUCT_LAMBDA_NAME!, { queryStringParameters: {} }, event)
    ]) as [
      APIGatewayProxyStructuredResultV2,
      APIGatewayProxyStructuredResultV2,
      APIGatewayProxyStructuredResultV2,
      APIGatewayProxyStructuredResultV2,
      APIGatewayProxyStructuredResultV2
    ];

    const client = JSON.parse(clientRes.body || '{}').data;
    const cashiers = JSON.parse(cashierRes.body || '{}').data || [];
    const consumes = JSON.parse(consumeRes.body || '{}').data || [];
    const expenses = JSON.parse(expenseRes.body || '{}').data || [];
    const products = JSON.parse(productRes.body || '{}').data || [];

    const responseData: EventReportData = {
      session,
      client,
      cashiers,
      consumes,
      expenses,
      products
    };

    const pdfBuffer = await generateEventPdf(responseData);
    const fileName = `${client.brand} ${session.name}.pdf`;
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

