import 'reflect-metadata';

import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { StatusCodes } from 'http-status-codes';
import { plainToInstance } from 'class-transformer';

import { docClient } from '@aws/dynamo/client.dynamo';
import { get } from '@aws/dynamo/get.dynamo';
import { validateBody } from '@utils/request/request.util';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

import { EmployeeDto } from '@dtos/employee/employee.dto';
import { SelfUpdateEmployeeDto } from '@dtos/employee/self-update.dto';
import { EmployeeTokenDto } from '@dtos/employee/token.dto';

const FIELDS_INVALID_MESSAGE = 'אחד מהשדות לא תקין';

const MESSAGES = new ResourceMessages('עובד', 'עובדים');

const invalidFieldsResponse = (): APIGatewayProxyResultV2 => ({
    statusCode: StatusCodes.BAD_REQUEST,
    body: JSON.stringify({ message: FIELDS_INVALID_MESSAGE }),
});

// Fields an employee may see/edit about themselves
const SELF_UPDATE_FIELDS = ['firstName', 'lastName', 'identityNumber', 'phone', 'workExperience', 'instagram', 'address', 'gender'] as const;

// Resolve unauthenticated shift registration token details directly from DynamoDB database table
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, EmployeeTokenDto, FIELDS_INVALID_MESSAGE);
        if (error) return invalidFieldsResponse();

        const tokenRes = await docClient.send(new GetCommand({
            TableName: process.env.TOKEN_TABLE!,
            Key: { token: body.token },
        }));

        const tokenItem = tokenRes.Item;
        const nowEpoch = Math.floor(Date.now() / 1000);
        const isTokenValid = tokenItem
            && tokenItem.used === false
            && typeof tokenItem.expiresAt === 'number'
            && tokenItem.expiresAt > nowEpoch;

        if (!isTokenValid) return invalidFieldsResponse();

        let employeeInstance: EmployeeDto | null;
        try {
            employeeInstance = await get(process.env.TABLE!, tokenItem.employeeId, EmployeeDto);
        } catch {
            return invalidFieldsResponse();
        }

        if (!employeeInstance) return invalidFieldsResponse();

        // Trim to self-editable fields + timestamp (for OCC on claim)
        const picked = Object.fromEntries(
            SELF_UPDATE_FIELDS.map((field) => [field, employeeInstance![field as keyof EmployeeDto]])
        );
        const data = plainToInstance(SelfUpdateEmployeeDto, { ...picked, timestamp: employeeInstance.timestamp });

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({ message: MESSAGES.SUCCESS.LOADED, data }),
        };
    } catch (err: unknown) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
};
