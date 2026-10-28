import { type APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@utils/logger/logger.util';
import { AWS_CONFIG } from '@env/config.env';

// WhatsApp service is retired; flip back to true to re-enable every WhatsApp lambda
export const WHATSAPP_SERVICE_ENABLED = false;
export const WHATSAPP_UNAVAILABLE_MESSAGE = 'השירות לא זמין יותר';

// Response every WhatsApp lambda returns while the service is off
export const whatsAppUnavailableResponse = (): APIGatewayProxyStructuredResultV2 => ({
    statusCode: StatusCodes.GONE,
    body: JSON.stringify({ message: WHATSAPP_UNAVAILABLE_MESSAGE }),
});

const META_GRAPH_API_VERSION = 'v25.0';
const DEFAULT_TEMPLATE_LANGUAGE = 'he';
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAYS = [500, 1500, 3000];
const REQUEST_TIMEOUT_MS = 10000;

export type WhatsAppSendResult =
    | {
          success: true;
          messageId?: string;
          status?: number;
          code?: number;
      }
    | {
          success: false;
          error: string;
          status?: number;
          code?: number;
          retryCount: number;
      };

// A single text placeholder value inside a template component
type TemplateTextParameter = { type: 'text'; text: string };

// Only the component shapes the approved templates actually use
type TemplateComponent =
    | { type: 'body'; parameters: TemplateTextParameter[] }
    | { type: 'button'; sub_type: 'url'; index: '0'; parameters: TemplateTextParameter[] };

export interface WhatsAppTemplateOptions {
    /** Ordered values for the {{1}}, {{2}}... placeholders in the template body. */
    bodyParams?: string[];
    /** Value appended to a dynamic URL button, when the template defines one. */
    buttonUrlParam?: string;
    /** Template language, defaults to Hebrew. */
    languageCode?: string;
}

/**
 * Redacts a phone number for safe logging, exposing only prefix and suffix.
 * Example: 972501234567 -> 9725****4567
 */
export function maskPhone(phone: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 4) return '****';
    if (digits.length <= 8) return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
    return `${digits.slice(0, 4)}****${digits.slice(-4)}`;
}

/**
 * Normalizes a phone number to the international format (without '+') expected by Meta WhatsApp Cloud API.
 * Handles Israeli mobile formats (05X, 5X, +9725X, 009725X).
 *
 * @param phone The raw phone number string.
 * @returns The normalized 12-digit string starting with 9725.
 */
export function formatWhatsAppPhone(phone: string): string {
    if (!phone) return '';

    // Strips any non-digit characters (spaces, dashes, pluses, parentheses)
    let digits = phone.trim().replace(/\D/g, '');

    // If starts with 00972, normalize international prefix
    if (digits.startsWith('00972')) {
        digits = digits.slice(2);
    }

    // If starts with 05, converts to 9725...
    if (digits.startsWith('05')) {
        digits = '972' + digits.slice(1);
    }
    // If starts with 5 (9-digit local mobile missing leading 0), converts to 9725...
    else if (digits.startsWith('5') && digits.length === 9) {
        digits = '972' + digits;
    }

    // If starts with +972, non-digit strip already removed the '+'

    // Validate length: Israeli mobile with country code 972 is 12 digits
    if (digits.length < 11 || digits.length > 13) {
        logger.warn(`Phone number has unusual length (${digits.length}): ${maskPhone(digits)}`);
    }

    return digits;
}

/**
 * Sanitizes template parameter values to comply with Meta's UTILITY template single-line parameter restrictions.
 * Meta rejects template parameters containing \r, \n, \t or multiple consecutive spaces.
 */
export function sanitizeTemplateParam(param: string): string {
    if (typeof param !== 'string') return String(param ?? '');
    return param
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

/**
 * Sanitizes dynamic URL button parameters, removing whitespace and line breaks.
 */
export function sanitizeButtonUrlParam(param: string): string {
    if (typeof param !== 'string') return String(param ?? '');
    return param.replace(/[\r\n\t\s]+/g, '').trim();
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Computes exponential backoff delay with +/- 20% random jitter.
 */
const calculateBackoff = (attemptIndex: number): number => {
    const baseDelay = RETRY_BASE_DELAYS[attemptIndex] ?? 3000;
    // +/- 20% random jitter (multiplier range: [0.8, 1.2])
    const jitter = 0.8 + Math.random() * 0.4;
    return Math.round(baseDelay * jitter);
};

/**
 * Determines whether an HTTP status code indicates a transient failure that should be retried.
 * Retries on HTTP 429 (rate limit) and 500, 502, 503, 504 (server errors).
 * Does NOT retry on 400 (Invalid Parameter), 401/403 (Invalid Token), etc.
 */
const isTransientStatus = (status: number): boolean => {
    return status === 429 || (status >= 500 && status <= 504);
};

/**
 * Posts an already-built message payload to the WhatsApp Cloud API with exponential backoff retries.
 *
 * @param payload The message body, minus the recipient and product fields.
 * @param phone The recipient's phone number.
 * @returns A promise resolving to the send result.
 */
async function postMessage(payload: Record<string, unknown>, phone: string): Promise<WhatsAppSendResult> {
    const { accessToken, phoneNumberId } = AWS_CONFIG.whatsapp;
    if (!accessToken || !phoneNumberId) {
        logger.warn('WhatsApp credentials are missing. Skipping message send.');
        return { success: false, error: 'WhatsApp credentials are missing', retryCount: 0 };
    }

    const formattedPhone = formatWhatsAppPhone(phone);
    const masked = maskPhone(formattedPhone);
    const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${phoneNumberId}/messages`;

    let lastError = '';
    let lastStatus: number | undefined;
    let retryCount = 0;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            let response: Response;
            try {
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: formattedPhone,
                        ...payload,
                    }),
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!response.ok) {
                lastStatus = response.status;
                const errorBody = await response.text();
                lastError = errorBody;

                const transient = isTransientStatus(lastStatus);

                if (transient && attempt < MAX_ATTEMPTS) {
                    retryCount++;
                    const delayMs = calculateBackoff(attempt - 1);
                    logger.warn(
                        `WhatsApp send attempt ${attempt} failed (status: ${lastStatus}) for ${masked}. Retrying in ${delayMs}ms...`,
                    );
                    await sleep(delayMs);
                    continue;
                }

                logger.error(
                    `Failed to send WhatsApp message to ${masked}. Status: ${lastStatus}, Attempts: ${attempt}`,
                );
                return {
                    success: false,
                    error: lastError,
                    code: lastStatus,
                    status: lastStatus,
                    retryCount,
                };
            }

            // Successfully accepted by Meta
            const acceptedBody = await response.text();
            let messageId: string | undefined;
            try {
                const parsed = JSON.parse(acceptedBody);
                messageId = parsed?.messages?.[0]?.id;
            } catch {
                // Ignore parse errors on body
            }

            logger.info(`WhatsApp accepted message (id: ${messageId || 'unknown'}) for ${masked}`);

            return {
                success: true,
                messageId,
                code: response.status,
                status: response.status,
            };
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            lastStatus = undefined;

            if (attempt < MAX_ATTEMPTS) {
                retryCount++;
                const delayMs = calculateBackoff(attempt - 1);
                logger.warn(
                    `WhatsApp network error on attempt ${attempt} for ${masked}: ${lastError}. Retrying in ${delayMs}ms...`,
                );
                await sleep(delayMs);
                continue;
            }

            logger.error(`Error sending WhatsApp message to ${masked} after ${attempt} attempts: ${lastError}`);
            return {
                success: false,
                error: lastError,
                retryCount,
            };
        }
    }

    return {
        success: false,
        error: lastError || 'Unknown error during WhatsApp send',
        code: lastStatus,
        status: lastStatus,
        retryCount,
    };
}

/**
 * Sends a plain text WhatsApp message via the Meta WhatsApp Cloud API.
 *
 * Only delivers inside the 24 hour customer service window, so it suits replies
 * rather than business-initiated notifications.
 *
 * @param phone The recipient's phone number.
 * @param messageText The message content.
 * @returns A promise resolving to the send result, including the failure reason when unsuccessful.
 */
export async function sendWhatsAppMessage(phone: string, messageText: string): Promise<WhatsAppSendResult> {
    return postMessage({ type: 'text', text: { body: messageText } }, phone);
}

/**
 * Sends an approved WhatsApp message template, which delivers regardless of the
 * 24 hour customer service window.
 *
 * @param phone The recipient's phone number.
 * @param templateName The approved template name.
 * @param options Placeholder values for the template body and dynamic URL button.
 * @returns A promise resolving to the send result, including the failure reason when unsuccessful.
 */
export async function sendWhatsAppTemplate(
    phone: string,
    templateName: string,
    options: WhatsAppTemplateOptions = {},
): Promise<WhatsAppSendResult> {
    const { bodyParams = [], buttonUrlParam, languageCode = DEFAULT_TEMPLATE_LANGUAGE } = options;
    const components: TemplateComponent[] = [];

    if (bodyParams.length > 0) {
        components.push({
            type: 'body',
            parameters: bodyParams.map((text) => ({
                type: 'text',
                text: sanitizeTemplateParam(text),
            })),
        });
    }

    // Dynamic URL buttons carry their value separately from the body placeholders
    if (buttonUrlParam) {
        components.push({
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
                {
                    type: 'text',
                    text: sanitizeButtonUrlParam(buttonUrlParam),
                },
            ],
        });
    }

    return postMessage(
        {
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode },
                ...(components.length > 0 && { components }),
            },
        },
        phone,
    );
}
