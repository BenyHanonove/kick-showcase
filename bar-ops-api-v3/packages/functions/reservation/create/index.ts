import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

// Import shared AWS services, guard security middleware, and utility helpers
import { validateBody } from '@utils/request/request.util';
import { create } from '@aws/dynamo/create.dynamo';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { CreateReservationDto } from '@dtos/reservation/create.dto';
import { ReservationDto } from '@dtos/reservation/reservation.dto';
import { ReservationStatus } from '@dtos/reservation/reservation.enum';

const MESSAGES = new ResourceMessages('הזמנה', 'הזמנות');

// Create new reservation record in DynamoDB database and return created resource DTO
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, CreateReservationDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        if (!body) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED }),
            };
        }

        // Store the lead with its opening status configuration setting for
        let reservationInstance: ReservationDto;
        try {
            const hasConsent = Boolean(body.marketingConsent);
            reservationInstance = await create(
                process.env.TABLE!,
                {
                    ...body,
                    status: ReservationStatus.NEW,
                    marketingConsent: hasConsent,
                    ...(hasConsent ? { marketingConsentAt: new Date().toISOString() } : {}),
                },
                ReservationDto
            );
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        // Returns the row it just wrote — every call creates
        // reveals nothing about rows the caller did not submit
        return {
            statusCode: StatusCodes.CREATED,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.CREATED,
                data: reservationInstance,
            }),
        };
    } catch (err) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
};
