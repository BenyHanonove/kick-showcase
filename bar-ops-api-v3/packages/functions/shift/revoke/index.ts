import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { plainToInstance } from 'class-transformer';

import { cascadeDeleteByField } from '@aws/dynamo/delete.dynamo';
import { RolesGuard } from '@guards/role.guard';
import { UserRole } from '@guards/user-role.enum';
import { extractId } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { RevokeShiftRegistrationResultDto } from '@dtos/shift/revoke-result.dto';

const MESSAGES = new ResourceMessages('משמרת', 'משמרות');

// Revoke all active shift registration tokens for specified session event record
export const handler = RolesGuard([UserRole.ADMIN], async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        // Path id is the session registration is being closed for
        const sessionId = extractId(event, 'sessionId', MESSAGES.ERROR.MISSING_ID);
        if (typeof sessionId !== 'string') return sessionId;

        // Every outstanding link for the session dies at once; the
        const revoked = await cascadeDeleteByField(
            process.env.TOKEN_TABLE!,
            'SessionIdIndex',
            'sessionId',
            sessionId,
            'token'
        );

        logger.info('[revoke] registration closed', { sessionId, revoked });

        // Idempotent: a session with no live tokens is already closed,
        const data = plainToInstance(RevokeShiftRegistrationResultDto, { revoked });

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({ message: MESSAGES.SUCCESS.DELETED, data }),
        };
    } catch (err: unknown) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
});
