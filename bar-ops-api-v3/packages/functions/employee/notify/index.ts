import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

// Import shared AWS services, guard security middleware, and utility helpers
import { validateBody } from '@utils/request/request.util';
import { get } from '@aws/dynamo/get.dynamo';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { ResourceMessages } from '@utils/messages/resource.util';
import { sendWhatsAppMessage, WHATSAPP_SERVICE_ENABLED, whatsAppUnavailableResponse } from '@utils/whatsapp/whatsapp.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { EmployeeDto } from '@dtos/employee/employee.dto';
import { NotifyEmployeeDto } from '@dtos/employee/notify.dto';

const MESSAGES = new ResourceMessages('עובד', 'עובדים');

// Dispatch shift notification messages to scheduled employees via delegated notification service
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    // WhatsApp service retired: answer with the unavailable note, send nothing
    if (!WHATSAPP_SERVICE_ENABLED) return whatsAppUnavailableResponse();

    try {
        // Validate the employee id + message text payload
        const { data: body, error } = await validateBody(event, NotifyEmployeeDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        // Load the employee from our own table; never trust a client-supplied phone
        const employee = await get(process.env.TABLE!, body.employeeId, EmployeeDto);
        if (!employee) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
            };
        }

        let formattedPhone = (employee.phone || '').trim().replace(/[-\s]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '+972' + formattedPhone.slice(1);
        } else if (!formattedPhone.startsWith('+') && formattedPhone.length > 0) {
            formattedPhone = '+' + formattedPhone;
        }

        // Resolve the {{firstName}} placeholder, allowing callers to build templates
        // without needing to look up the employee themselves
        const messageText = body.text.replace(/{{firstName}}/g, employee.firstName);

        const sendResult = await sendWhatsAppMessage(formattedPhone, messageText);

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: sendResult.success ? 'הודעת ה-WhatsApp נשלחה בהצלחה' : 'שליחת הודעת ה-WhatsApp נכשלה',
                data: {
                    recipient: {
                        name: `${employee.firstName} ${employee.lastName}`,
                        phone: formattedPhone,
                    },
                    whatsappSent: sendResult.success,
                    whatsappError: sendResult.success ? undefined : sendResult.error,
                },
            }),
        };
    } catch (err) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
});
