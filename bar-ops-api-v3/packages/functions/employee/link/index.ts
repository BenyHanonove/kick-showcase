import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { StatusCodes } from 'http-status-codes';

// Import shared AWS services, guard security middleware, and utility helpers
import { docClient } from '@aws/dynamo/client.dynamo';
import { get } from '@aws/dynamo/get.dynamo';
import { RolesGuard, contextStorage } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { extractId } from '@utils/request/request.util';
import { generateToken } from '@utils/token/token.util';
import { sendWhatsAppTemplate, formatWhatsAppPhone, WHATSAPP_SERVICE_ENABLED, whatsAppUnavailableResponse } from '@utils/whatsapp/whatsapp.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { EmployeeDto } from '@dtos/employee/employee.dto';

const MESSAGES = new ResourceMessages('עובד', 'עובדים');

const TOKEN_TTL_HOURS = 1;

// Approved template: body {{1}} = first name, URL button carries the token
const TEMPLATE_NAME = 'employee_details_update';

// Process employee link operation request and return JSON HTTP response
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    // WhatsApp service retired: answer with the unavailable note, send nothing
    if (!WHATSAPP_SERVICE_ENABLED) return whatsAppUnavailableResponse();

    try {
        const id = extractId(event, 'id', MESSAGES.ERROR.MISSING_ID);
        if (typeof id !== 'string') return id;

        logger.info('[link] 1. start', { employeeId: id });

        let employeeInstance: EmployeeDto | null;
        try {
            employeeInstance = await get(process.env.TABLE!, id, EmployeeDto);
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        if (!employeeInstance) {
            logger.warn('[link] employee not found', { employeeId: id });
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
            };
        }

        // Key names avoid the logger's phone/token redaction so the values actually print
        const rawPhone = employeeInstance.phone || '';
        logger.info('[link] 2. employee loaded', {
            firstName: employeeInstance.firstName,
            digits: rawPhone.length,
            tail: rawPhone.slice(-4),
            normalized: formatWhatsAppPhone(rawPhone),
        });

        // Overwrite semantics: drop any existing token for this employee before
        const existing = await docClient.send(new QueryCommand({
            TableName: process.env.TOKEN_TABLE!,
            IndexName: 'EmployeeIdIndex',
            KeyConditionExpression: 'employeeId = :employeeId',
            ExpressionAttributeValues: { ':employeeId': id },
        }));

        for (const item of existing.Items || []) {
            await docClient.send(new DeleteCommand({
                TableName: process.env.TOKEN_TABLE!,
                Key: { token: item.token },
            }));
        }

        logger.info('[link] 3. cleared old tokens', { count: existing.Items?.length ?? 0 });

        const token = generateToken();
        const now = new Date();
        const expiresAtEpoch = Math.floor(now.getTime() / 1000) + TOKEN_TTL_HOURS * 60 * 60;
        const editorId = contextStorage.getStore()?.editorId;

        await docClient.send(new PutCommand({
            TableName: process.env.TOKEN_TABLE!,
            Item: {
                token,
                employeeId: id,
                expiresAt: expiresAtEpoch,
                used: false,
                createdBy: editorId,
                createdAt: now.toISOString(),
            },
        }));

        logger.info('[link] 4. token stored', {
            expiresAt: new Date(expiresAtEpoch * 1000).toISOString(),
            chars: token.length,
        });

        logger.info('[link] 5. sending template', {
            template: TEMPLATE_NAME,
            language: 'he',
            bodyParams: [employeeInstance.firstName],
            buttonParamChars: token.length,
        });

        // Deliver the link over WhatsApp; the token in the button
        const sendResult = await sendWhatsAppTemplate(employeeInstance.phone, TEMPLATE_NAME, {
            bodyParams: [employeeInstance.firstName],
            buttonUrlParam: token,
        });

        if (sendResult.success) {
            logger.info('[link] 6. whatsapp accepted the message');
        } else {
            logger.warn('[link] 6. whatsapp rejected the message', {
                status: sendResult.status,
                reason: sendResult.error,
            });
        }

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.CREATED,
                data: {
                    token,
                    expiresAt: new Date(expiresAtEpoch * 1000).toISOString(),
                    notified: sendResult.success,
                    notifyError: sendResult.success ? undefined : sendResult.error,
                    notifyStatus: sendResult.success ? undefined : sendResult.status,
                },
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
