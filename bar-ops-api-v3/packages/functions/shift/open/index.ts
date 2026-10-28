import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2, type APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import { plainToInstance } from 'class-transformer';

import { docClient } from '@aws/dynamo/client.dynamo';
import { list } from '@aws/dynamo/list.dynamo';
import { invokeLambda } from '@aws/lambdas/lambda';
import { RolesGuard, contextStorage } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { extractId, validateBody } from '@utils/request/request.util';
import { generateToken } from '@utils/token/token.util';
import { sendWhatsAppTemplate, formatWhatsAppPhone, WHATSAPP_SERVICE_ENABLED, whatsAppUnavailableResponse } from '@utils/whatsapp/whatsapp.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { OpenShiftRegistrationDto } from '@dtos/shift/open.dto';
import { OpenShiftRegistrationResultDto } from '@dtos/shift/open-result.dto';
import { ShiftRegistrationTokenDto } from '@dtos/shift/registration-token.dto';
import { ShiftDto } from '@dtos/shift/shift.dto';

const MESSAGES = new ResourceMessages('משמרת', 'משמרות');

// Any shift on the event, whatever its registration, means no invite
const ALREADY_STAFFED_MESSAGE = 'לעובד כבר קיימת משמרת באירוע זה';

// Registration link lifetime, matching the 24 hours the template copy promises
const TOKEN_TTL_HOURS = 24;

// Approved template: body {{1}} first name, {{2}} event, {{3}} datetime, {{4}} location.
const TEMPLATE_NAME = 'shift_availability_request';

// Only the fields this lambda reads off the invoked lambdas' payloads
interface SessionPayload {
    clientId: string;
    name: string;
    datetime: string;
    location: string;
}

interface ClientPayload {
    brand: string;
}

interface EmployeePayload {
    id: string;
    firstName: string;
    phone?: string;
}

// Unwrap the { message, data } envelope every invoked lambda returns
const readData = <T>(result: APIGatewayProxyStructuredResultV2): T | null => {
    try {
        return JSON.parse(result.body || '{}').data ?? null;
    } catch {
        return null;
    }
};

// Naive local string, no offset - parse directly so the
const formatDatetime = (isoString: string): string => {
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
    if (!match) return isoString;

    const [, year, month, day, hour = '00', minute = '00'] = match;
    return `${day}/${month}/${year.slice(2)} ${hour}:${minute}`;
};

// Mint shift registration tokens for invited employees and dispatch notifications via WhatsApp
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    // WhatsApp service retired: answer with the unavailable note, send nothing
    if (!WHATSAPP_SERVICE_ENABLED) return whatsAppUnavailableResponse();

    try {
        // Path id is the session registration is being opened for
        const sessionId = extractId(event, 'sessionId', MESSAGES.ERROR.MISSING_ID);
        if (typeof sessionId !== 'string') return sessionId;

        // Body names the single employee being invited
        const { data: body, error } = await validateBody(event, OpenShiftRegistrationDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        const { employeeId } = body;
        logger.info('[open] 1. start', { sessionId, employeeId });

        // Checked first, so no token is minted and no WhatsApp is sent
        const existing = await list(process.env.TABLE!, ShiftDto, {
            indexName: 'SessionIdIndex',
            keyConditionExpression: 'sessionId = :sessionId',
            filterExpression: 'employeeId = :employeeId',
            expressionAttributeValues: { ':sessionId': sessionId, ':employeeId': employeeId },
        });

        if (existing.length > 0) {
            logger.warn('[open] employee already has a shift on this event', {
                sessionId,
                employeeId,
                registration: existing[0].registration,
            });
            return {
                statusCode: StatusCodes.CONFLICT,
                body: JSON.stringify({ message: ALREADY_STAFFED_MESSAGE }),
            };
        }

        const [sessionRes, employeeRes] = await Promise.all([
            invokeLambda(process.env.SESSION_GET_LAMBDA_NAME!, { pathParameters: { id: sessionId } }, event),
            invokeLambda(process.env.EMPLOYEE_GET_LAMBDA_NAME!, { pathParameters: { id: employeeId } }, event),
        ]) as [APIGatewayProxyStructuredResultV2, APIGatewayProxyStructuredResultV2];

        const session = readData<SessionPayload>(sessionRes);
        const employee = readData<EmployeePayload>(employeeRes);

        if (!session || !employee) {
            logger.warn('[open] fixture missing', {
                sessionId,
                employeeId,
                sessionStatus: sessionRes.statusCode,
                employeeStatus: employeeRes.statusCode,
            });
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: MESSAGES.ERROR.NOT_FOUND }),
            };
        }

        // The session only names the client, so the brand needs
        const clientRes = await invokeLambda(
            process.env.CLIENT_GET_LAMBDA_NAME!,
            { pathParameters: { id: session.clientId } },
            event
        ) as APIGatewayProxyStructuredResultV2;

        const brand = readData<ClientPayload>(clientRes)?.brand ?? '';

        logger.info('[open] 2. fixtures loaded', {
            session: session.name,
            brand,
            firstName: employee.firstName,
        });

        // Overwrite semantics: one live token per employee per session
        const existingTokens = await docClient.send(new QueryCommand({
            TableName: process.env.TOKEN_TABLE!,
            IndexName: 'SessionIdIndex',
            KeyConditionExpression: 'sessionId = :sessionId',
            ExpressionAttributeValues: { ':sessionId': sessionId },
        }));

        const stale = (existingTokens.Items || []).filter((item) => item.employeeId === employeeId);
        for (const item of stale) {
            await docClient.send(new DeleteCommand({
                TableName: process.env.TOKEN_TABLE!,
                Key: { token: item.token },
            }));
        }

        logger.info('[open] 3. cleared old tokens', { deleted: stale.length });

        const now = new Date();
        const expiresAtEpoch = Math.floor(now.getTime() / 1000) + TOKEN_TTL_HOURS * 60 * 60;
        const token = generateToken();

        // Everything the public page renders is snapshotted here, so resolve
        const item: ShiftRegistrationTokenDto = {
            id: uuidv4(),
            token,
            sessionId,
            employeeId,
            firstName: employee.firstName,
            name: session.name,
            brand,
            datetime: session.datetime,
            location: session.location,
            expiresAt: expiresAtEpoch,
            used: false,
            createdAt: now.toISOString(),
            createdBy: contextStorage.getStore()?.editorId,
        };

        await docClient.send(new PutCommand({
            TableName: process.env.TOKEN_TABLE!,
            Item: item,
        }));

        logger.info('[open] 4. token stored', {
            expiresAt: new Date(expiresAtEpoch * 1000).toISOString(),
            chars: token.length,
        });

        const result = (sent: boolean) => plainToInstance(OpenShiftRegistrationResultDto, {
            token,
            sent,
            expiresAt: new Date(expiresAtEpoch * 1000).toISOString(),
        });

        // An employee with no phone still gets a token, it
        if (!employee.phone) {
            logger.warn('[open] 5. no phone on file', { employeeId });
            return {
                statusCode: StatusCodes.OK,
                body: JSON.stringify({ message: MESSAGES.SUCCESS.CREATED, data: result(false) }),
            };
        }

        // Names carry stray whitespace in the table; trimming keeps the greeting clean
        const bodyParams = [
            employee.firstName.trim(),
            session.name.trim(),
            formatDatetime(session.datetime),
            session.location.trim(),
        ];

        // Key names avoid the logger's phone/token redaction so the values actually print
        logger.info('[open] 5. sending template', {
            template: TEMPLATE_NAME,
            language: 'he',
            bodyParams,
            digits: employee.phone.length,
            tail: employee.phone.slice(-4),
            normalized: formatWhatsAppPhone(employee.phone),
        });

        const sendResult = await sendWhatsAppTemplate(employee.phone, TEMPLATE_NAME, {
            bodyParams,
            buttonUrlParam: token,
        });

        if (sendResult.success) {
            logger.info('[open] 6. whatsapp accepted the message');
        } else {
            logger.warn('[open] 6. whatsapp rejected the message', {
                status: sendResult.status,
                reason: sendResult.error,
            });
        }

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({ message: MESSAGES.SUCCESS.CREATED, data: result(sendResult.success) }),
        };
    } catch (err: unknown) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
});
