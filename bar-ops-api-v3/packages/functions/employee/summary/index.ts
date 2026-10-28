import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyResultV2, type APIGatewayProxyEventV2, type APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import ExcelJS from 'exceljs';

// Import shared AWS services, guard security middleware, and utility helpers
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { invokeLambda } from '@aws/lambdas/lambda';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { EmployeeDto } from '@dtos/employee/employee.dto';
import { SessionDto } from '@dtos/session/session.dto';
import { ShiftDto } from '@dtos/shift/shift.dto';

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const MESSAGES = new ResourceMessages('עובד', 'עובדים');

// Process employee summary operation request and return JSON HTTP response
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const sessionId = event.pathParameters?.sessionId;
        if (!sessionId) {
            return { statusCode: 400, body: JSON.stringify({ message: MESSAGES.ERROR.MISSING_ID }) };
        }

        const [sessionRes, shiftsRes] = await Promise.all([
            invokeLambda(process.env.SESSION_LAMBDA_NAME!, { pathParameters: { id: sessionId } }, event),
            invokeLambda(process.env.SHIFT_LAMBDA_NAME!, { queryStringParameters: { sessionId } }, event)
        ]) as [APIGatewayProxyStructuredResultV2, APIGatewayProxyStructuredResultV2];

        const session: SessionDto = JSON.parse(sessionRes.body || '{}').data;
        const shifts: ShiftDto[] = JSON.parse(shiftsRes.body || '{}').data || [];
        const uniqueEmployeeIds = [...new Set(shifts.map((s: ShiftDto) => s.employeeId))];

        let employees: EmployeeDto[] = [];
        if (uniqueEmployeeIds.length > 0) {
            const command = new BatchGetCommand({
                RequestItems: {
                    [process.env.TABLE!]: {
                        Keys: uniqueEmployeeIds.map(id => ({ id }))
                    }
                }
            });
            const { Responses } = await ddbDocClient.send(command);
            employees = (Responses?.[process.env.TABLE!] as EmployeeDto[]) || [];
        }
        const sortedEmployees = [...employees].sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.trim();
            const nameB = `${b.firstName} ${b.lastName}`.trim();
            return nameA.localeCompare(nameB, 'he');
        });

        const headers = ['שם מלא', 'טלפון', 'תעודת זהות'];

        const rows = sortedEmployees.map(emp => {
            const name = `${emp.firstName} ${emp.lastName}`.trim();
            const rawPhone = emp.phone || '';
            const formattedPhone = rawPhone.length > 3
                ? `${rawPhone.slice(0, 3)}-${rawPhone.slice(3)}`
                : rawPhone;
            const id = emp.identityNumber || '';
            return [name, formattedPhone, id];
        });

        // Create workbook and RTL sheet for Hebrew layout
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('דוח עובדים', { views: [{ rightToLeft: true }] });

        ws.addRow(headers);
        rows.forEach((row) => ws.addRow(row));

        // Adjust column widths: שם מלא / טלפון / תעודת זהות
        ws.getColumn(1).width = 25;
        ws.getColumn(2).width = 15;
        ws.getColumn(3).width = 15;

        // Write workbook to a buffer (xlsx format) configuration setting for
        const excelBuffer = await wb.xlsx.writeBuffer();

        const fileName = `${session.name || 'דוח'}_רשימת_עובדים.xlsx`.replace(/\s+/g, '_');
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
            },
            body: Buffer.from(excelBuffer).toString('base64'),
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