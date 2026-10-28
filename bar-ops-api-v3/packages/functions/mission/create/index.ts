import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

// Import shared AWS services, guard security middleware, and utility helpers
import { validateBody } from '@utils/request/request.util';
import { create } from '@aws/dynamo/create.dynamo';
import { invokeLambda } from '@aws/lambdas/lambda';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { CreateMissionDto } from '@dtos/mission/create.dto';
import { MissionDto } from '@dtos/mission/mission.dto';
import { MissionStatus } from '@dtos/mission/mission.enum';
import { SessionDto } from '@dtos/session/session.dto';

const MESSAGES = new ResourceMessages('משימה', 'משימות');

// Create new mission record in DynamoDB database and return created resource DTO
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, CreateMissionDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        if (!body) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED }),
            };
        }

        // Fetch session to get monthYear from its datetime
        let sessionResponse: APIGatewayProxyResultV2;
        try {
            sessionResponse = await invokeLambda(process.env.SESSION_LAMBDA_NAME!, {
                pathParameters: { id: body.sessionId },
            }, event);
        } catch (err) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: 'Failed to fetch session', error: String(err) }),
            };
        }

        if (typeof sessionResponse === 'string' || sessionResponse.statusCode !== StatusCodes.OK) {
            return sessionResponse;
        }

        const sessionResponseBody = sessionResponse.body;
        if (!sessionResponseBody || typeof sessionResponseBody !== 'string') {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: 'Invalid session response' }),
            };
        }

        const sessionData = JSON.parse(sessionResponseBody);
        const session: SessionDto = sessionData.data;

        // Extract monthYear from session datetime (YYYY-MM format) configuration setting for
        const dateObj = new Date(session.datetime);
        const monthYear = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

        // Merge validated body with default status and derived monthYear
        const missionPayload = { ...body, status: MissionStatus.PENDING, monthYear };

        let missionInstance: MissionDto;
        try {
            missionInstance = await create(process.env.TABLE!, missionPayload, MissionDto);
        } catch (errors) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
            };
        }

        return {
            statusCode: StatusCodes.CREATED,
            body: JSON.stringify({
                message: MESSAGES.SUCCESS.CREATED,
                data: missionInstance,
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
