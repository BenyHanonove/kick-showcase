import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2, type APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { invokeLambda } from '@aws/lambdas/lambda';
import { extractId } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { sendWhatsAppTemplate, formatWhatsAppPhone, WHATSAPP_SERVICE_ENABLED, whatsAppUnavailableResponse } from '@utils/whatsapp/whatsapp.util';
import { logger } from '@utils/logger/logger.util';

const MESSAGES = new ResourceMessages('משמרת', 'משמרות');

// Approved template: body {{1}} = first name, {{2}} = session
const TEMPLATE_NAME = 'shift_assignment_notice';

// Only the fields this lambda reads off the invoked lambdas' payloads
interface SessionPayload {
    name: string;
    datetime?: string;
}

interface ShiftPayload {
    id: string;
    employeeId: string;
    timing?: string;
}

interface EmployeePayload {
    id: string;
    firstName: string;
    phone?: string;
}

// Outcome of a single employee's notification, returned for admin visibility
interface RecipientResult {
    shiftId: string;
    employeeId: string;
    name?: string;
    sent: boolean;
    reason?: string;
}

// Timings without a zone suffix are already Israel local and are formatted as-is
const NAIVE_DATETIME = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?$/;

// Helper to format timing string in Israel timezone (Asia/Jerusalem)
const formatTiming = (isoString?: string): string => {
    if (!isoString) return "";

    // Converting a naive string would shift it by the UTC
    const naive = isoString.match(NAIVE_DATETIME);
    if (naive) {
        const [, year, month, day, hour = '00', minute = '00'] = naive;
        return `${day}/${month}/${year.slice(2)} ${hour}:${minute}`;
    }

    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;

        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Jerusalem',
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const parts = formatter.formatToParts(date);
        const day = parts.find(p => p.type === 'day')?.value || '';
        const month = parts.find(p => p.type === 'month')?.value || '';
        const year = parts.find(p => p.type === 'year')?.value || '';
        const hour = parts.find(p => p.type === 'hour')?.value || '';
        const minute = parts.find(p => p.type === 'minute')?.value || '';

        return `${day}/${month}/${year} ${hour}:${minute}`;
    } catch {
        return isoString;
    }
}

// Unwrap the { message, data } envelope every invoked lambda returns
const readData = <T>(result: APIGatewayProxyStructuredResultV2): T | null => {
    try {
        return JSON.parse(result.body || '{}').data ?? null;
    } catch {
        return null;
    }
};

// Orchestrate WhatsApp shift notification delivery by invoking session and employee services
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    // WhatsApp service retired: answer with the unavailable note, send nothing
    if (!WHATSAPP_SERVICE_ENABLED) return whatsAppUnavailableResponse();

    try {
        // Path id: the session whose staff receive the broadcast
        const sessionId = extractId(event, 'id', MESSAGES.ERROR.MISSING_ID);
        if (typeof sessionId !== 'string') return sessionId;

        logger.info('[notify] 1. start', {
            sessionId,
            template: TEMPLATE_NAME,
            language: 'he',
            sessionGetLambda: process.env.SESSION_GET_LAMBDA_NAME,
            shiftListLambda: process.env.SHIFT_LIST_LAMBDA_NAME,
            employeeListLambda: process.env.EMPLOYEE_LIST_LAMBDA_NAME,
        });

        // Session details and its shifts are independent lookups
        const [sessionRes, shiftsRes] = await Promise.all([
            invokeLambda(
                process.env.SESSION_GET_LAMBDA_NAME!,
                { pathParameters: { id: sessionId } },
                event
            ),
            invokeLambda(
                process.env.SHIFT_LIST_LAMBDA_NAME!,
                { queryStringParameters: { sessionId } },
                event
            ),
        ]) as [APIGatewayProxyStructuredResultV2, APIGatewayProxyStructuredResultV2];

        logger.info('[notify] 2. invokes returned', {
            sessionStatus: sessionRes.statusCode,
            shiftsStatus: shiftsRes.statusCode,
        });

        const session = readData<SessionPayload>(sessionRes);
        if (!session) {
            logger.warn('[notify] session missing', { sessionId, body: sessionRes.body });
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: 'Session not found.' }),
            };
        }

        const shifts = readData<ShiftPayload[]>(shiftsRes) ?? [];
        logger.info('[notify] 3. session and shifts loaded', {
            session: session.name,
            sessionDatetime: session.datetime,
            shifts: shifts.length,
            shiftIds: shifts.map((shift) => shift.id),
            employeeIds: shifts.map((shift) => shift.employeeId),
        });

        if (!shifts.length) {
            logger.warn('[notify] no shifts for session', { sessionId });
            return {
                statusCode: StatusCodes.OK,
                body: JSON.stringify({
                    message: 'No shifts to notify for this session.',
                    data: { session: session.name, total: 0, sent: 0, failed: 0, recipients: [] },
                }),
            };
        }

        // Employee list is unfiltered; index it so shifts can resolve their employee
        const employeesRes = await invokeLambda(
            process.env.EMPLOYEE_LIST_LAMBDA_NAME!,
            {},
            event
        ) as APIGatewayProxyStructuredResultV2;

        const employees = readData<EmployeePayload[]>(employeesRes) ?? [];
        const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
        logger.info('[notify] 4. employees loaded', {
            status: employeesRes.statusCode,
            employees: employees.length,
            matched: shifts.filter((shift) => employeeById.has(shift.employeeId)).length,
        });

        // Send one template per shift, sequentially to stay under Meta's rate limits
        const recipients: RecipientResult[] = [];

        let index = 0;

        for (const shift of shifts) {
            index += 1;
            const employee = employeeById.get(shift.employeeId);

            if (!employee || !employee.phone) {
                const reason = employee ? 'missing phone' : 'employee not found';
                logger.warn(`[notify] 5.${index} skipped`, { shiftId: shift.id, employeeId: shift.employeeId, reason });
                recipients.push({
                    shiftId: shift.id,
                    employeeId: shift.employeeId,
                    name: employee?.firstName,
                    sent: false,
                    reason,
                });
                continue;
            }

            // Names carry stray whitespace in the table; trimming keeps "היי שון," clean
            const bodyParams = [employee.firstName.trim(), session.name.trim(), formatTiming(shift.timing || session.datetime)];

            // Key names avoid the logger's phone redaction so the values actually print
            const rawPhone = employee.phone;
            logger.info(`[notify] 5.${index} sending`, {
                shiftId: shift.id,
                template: TEMPLATE_NAME,
                bodyParams,
                digits: rawPhone.length,
                tail: rawPhone.slice(-4),
                normalized: formatWhatsAppPhone(rawPhone),
                shiftTiming: shift.timing ?? '(falls back to session datetime)',
            });

            // Raw phone in, same as the employee link lambda: sendWhatsAppTemplate normalizes it
            const sendResult = await sendWhatsAppTemplate(rawPhone, TEMPLATE_NAME, { bodyParams });

            if (sendResult.success) {
                logger.info(`[notify] 5.${index} whatsapp accepted`, { name: employee.firstName });
            } else {
                logger.warn(`[notify] 5.${index} whatsapp rejected`, {
                    name: employee.firstName,
                    status: sendResult.status,
                    reason: sendResult.error,
                });
            }

            recipients.push({
                shiftId: shift.id,
                employeeId: employee.id,
                name: employee.firstName,
                sent: sendResult.success,
                reason: sendResult.success ? undefined : sendResult.error,
            });
        }

        const sent = recipients.filter((recipient) => recipient.sent).length;
        const failed = recipients.length - sent;
        logger.info('[notify] 6. done', {
            session: session.name,
            total: recipients.length,
            sent,
            failed,
            recipients,
        });

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: 'Shift notifications processed successfully.',
                data: {
                    session: session.name,
                    template: TEMPLATE_NAME,
                    total: recipients.length,
                    sent,
                    failed,
                    recipients,
                },
            }),
        };
    } catch (err) {
        logger.error("Error sending shift notifications:", err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
});
