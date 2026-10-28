import 'reflect-metadata';

// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

// Import shared AWS services, guard security middleware, and utility helpers
import { validateBody } from '@utils/request/request.util';
import { employeeCredentialsExist } from '@validation/employee.validation';
import { create } from '@aws/dynamo/create.dynamo';
import { ResourceMessages } from '@utils/messages/resource.util';
import { logger } from '@utils/logger/logger.util';

// Import resource data transfer objects for payload transformation and validation
import { RegisterEmployeeDto } from '@dtos/employee/register.dto';
import { EmployeeDto } from '@dtos/employee/employee.dto';
import { EmployeeStatus } from '@dtos/employee/employee.enum';

const MESSAGES = new ResourceMessages('עובד', 'עובדים');

// Register employee worker for scheduled shift event using active registration token
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { data: body, error } = await validateBody(event, RegisterEmployeeDto, MESSAGES.ERROR.VALIDATION_FAILED);
        if (error) return error;

        // Uniform response prevents enumeration; duplicates skip silently configuration setting for
        if (!(await employeeCredentialsExist(body))) {
            try {
                await create(
                    process.env.TABLE!,
                    { ...body, status: EmployeeStatus.PENDING },
                    EmployeeDto
                );
            } catch (errors) {
                return {
                    statusCode: StatusCodes.BAD_REQUEST,
                    body: JSON.stringify({ message: MESSAGES.ERROR.VALIDATION_FAILED, errors }),
                };
            }
        }

        // Identical response whether or not the employee already existed
        return {
            statusCode: StatusCodes.CREATED,
            body: JSON.stringify({ message: MESSAGES.SUCCESS.CREATED }),
        };
    } catch (err) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.ERROR.INTERNAL_SERVER_ERROR }),
        };
    }
};
