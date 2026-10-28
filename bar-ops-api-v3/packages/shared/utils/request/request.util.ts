import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2, type APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { validate } from 'class-validator';
import { plainToInstance, type ClassConstructor } from 'class-transformer';

export const extractId = (
    event: APIGatewayProxyEventV2,
    paramName: string = 'id',
    message: string = 'מזהה חסר'
): string | APIGatewayProxyResultV2 => {
    const val = event.pathParameters?.[paramName];

    if (!val) {
        return {
            statusCode: StatusCodes.BAD_REQUEST,
            body: JSON.stringify({ message }),
        };
    }

    return val;
};

// Extract string from query parameters
export const extractQueryParam = (
    event: APIGatewayProxyEventV2,
    paramName: string,
    message: string = 'פרמטר חסר'
): string | APIGatewayProxyResultV2 => {
    const val = event.queryStringParameters?.[paramName];

    if (!val) {
        return {
            statusCode: StatusCodes.BAD_REQUEST,
            body: JSON.stringify({ message }),
        };
    }

    return val;
};

// Parse and validate request body
export const validateBody = async <T extends object>(
    event: APIGatewayProxyEventV2,
    dtoClass: ClassConstructor<T>,
    errorMessage: string = 'שגיאת ולידציה'
): Promise<{ data: T; error: null } | { data: null; error: APIGatewayProxyStructuredResultV2 }> => {
    try {
        const body = JSON.parse(event.body || '{}');

        const instance = plainToInstance(dtoClass, body, {
            enableImplicitConversion: true,
        });

        const errors = await validate(instance, { whitelist: true });

        if (errors.length > 0) {
            return {
                data: null,
                error: {
                    statusCode: StatusCodes.BAD_REQUEST,
                    body: JSON.stringify({ message: errorMessage, errors }),
                }
            };
        }

        return { data: instance, error: null };
    } catch (err) {
        return {
            data: null,
            error: {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: errorMessage }),
            }
        };
    }
};

export const validateInstance = async <T extends object, U extends object = object>(
    data: U,
    dtoClass: ClassConstructor<T>,
    errorMessage: string = 'שגיאת ולידציה'
): Promise<{ data: T; error: null } | { data: null; error: APIGatewayProxyStructuredResultV2 }> => {
    const instance = plainToInstance(dtoClass, data, {
        enableImplicitConversion: true,
    });

    const errors = await validate(instance, { whitelist: true });

    if (errors.length > 0) {
        return {
            data: null,
            error: {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: errorMessage, errors }),
            }
        };
    }

    return { data: instance, error: null };
};
