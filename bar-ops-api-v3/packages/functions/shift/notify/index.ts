import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2, type APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { list } from '@aws/dynamo/list.dynamo';
import { invokeLambda } from '@aws/lambdas/lambda';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { extractId } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { WHATSAPP_SERVICE_ENABLED, whatsAppUnavailableResponse } from '@utils/whatsapp/whatsapp.util';
import { logger } from '@utils/logger/logger.util';

import { ShiftDto } from '@dtos/shift/shift.dto';

const MESSAGES = new ResourceMessages('משמרת', 'משמרות');

// Naive local string, no offset — parse directly, don't go
const formatDateTime = (isoString: string): { date: string; time: string } => {
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return { date: isoString, time: '' };

    const [, year, month, day, hour, minute] = match;
    return {
        date: `${day}/${month}/${year.slice(2)}`,
        time: `${hour}:${minute}`,
    };
};

// Build the shift reminder message; {{firstName}} is resolved by EmployeeNotify
const buildMessage = (sessionName: string, location: string, timing: string): string => {
    const { date, time } = formatDateTime(timing);
    return `היי {{firstName}} 👋\n` +
        `אתה מוכן לאירוע "${sessionName}"? 🎉\n` +
        `המשמרת שלך תוזמנה לשעה ${time}\n` +
        `בתאריך ${date}\n` +
        `במיקום ${location}\n\n` +
        `תגיע עם מצב רוח, אנחנו צריכים אותך! 💪`;
};

// Dispatch shift notification messages to scheduled employees via delegated notification service
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    // WhatsApp service retired: answer with the unavailable note, send nothing
    if (!WHATSAPP_SERVICE_ENABLED) return whatsAppUnavailableResponse();

    try {
        const sessionId = extractId(event, 'sessionId', MESSAGES.ERROR.MISSING_ID);
        if (typeof sessionId !== 'string') return sessionId;

        // Load this session's shifts and the session details in parallel
        const [shifts, sessionRes] = await Promise.all([
            list(process.env.TABLE!, ShiftDto, {
                indexName: 'SessionIdIndex',
                keyConditionExpression: 'sessionId = :sid',
                expressionAttributeValues: { ':sid': sessionId },
            }),
            invokeLambda(
                process.env.SESSION_GET_LAMBDA_NAME!,
                { pathParameters: { id: sessionId } },
                event
            ) as Promise<APIGatewayProxyStructuredResultV2>,
        ]);

        const session = JSON.parse(sessionRes.body || '{}').data;
        if (!session) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: 'Session not found.' }),
            };
        }

        if (shifts.length === 0) {
            return {
                statusCode: StatusCodes.OK,
                body: JSON.stringify({ message: 'No shifts found for this session.', data: { total: 0, notified: 0 } }),
            };
        }

        // Timing is required per shift — skip any shift missing
        const timedShifts = shifts.filter((shift) => Boolean(shift.timing));

        // Notify every shift's employee in parallel, passing only the employeeId
        const results = await Promise.all(timedShifts.map((shift) =>
            invokeLambda(
                process.env.EMPLOYEE_NOTIFY_LAMBDA_NAME!,
                {
                    body: JSON.stringify({
                        employeeId: shift.employeeId,
                        text: buildMessage(session.name, session.location, shift.timing!),
                    }),
                },
                event
            ) as Promise<APIGatewayProxyStructuredResultV2>
        ));

        const notified = results.filter(r => r.statusCode === StatusCodes.OK).length;

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: 'Shift notifications processed.',
                data: { total: shifts.length, skippedNoTiming: shifts.length - timedShifts.length, notified },
            }),
        };
    } catch (err) {
        logger.error('Error sending shift notifications:', err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
});
