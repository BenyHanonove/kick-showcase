// Import external framework dependencies and status codes from third party packages
import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

// Import shared AWS services, guard security middleware, and utility helpers
import { docClient } from '@aws/dynamo/client.dynamo';
import { ResourceMessages } from '@utils/messages/resource.util';
import { validateBody } from '@utils/request/request.util';

// Import resource data transfer objects for payload transformation and validation
import { CreateEmployeeDto } from '@dtos/employee/create.dto';

export const validateEmployeeBody = async <
    S extends Record<string, string>,
    E extends Record<string, string>
>(
    event: APIGatewayProxyEventV2,
    messages: ResourceMessages<S, E>
): Promise<{ data: CreateEmployeeDto; error: null } | { data: null; error: APIGatewayProxyResultV2 }> => {
    const result = await validateBody(event, CreateEmployeeDto, messages.ERROR.VALIDATION_FAILED);
    if (result.error) return result;
    if (!result.data) {
        return {
            data: null,
            error: {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: messages.ERROR.VALIDATION_FAILED }),
            }
        };
    }

    const body = result.data;

    if (await employeeCredentialsExist(body)) {
        return {
            data: null,
            error: {
                statusCode: StatusCodes.CONFLICT,
                body: JSON.stringify({ message: messages.ERROR.CREDENTIALS_ALREADY_EXISTS }),
            }
        };
    }

    return { data: body, error: null };
};

// Check if phone or identity number already exists
export const employeeCredentialsExist = async (
    body: Pick<CreateEmployeeDto, 'phone' | 'identityNumber'>
): Promise<boolean> => {
    const [phoneCheck, idCheck] = await Promise.all([
        docClient.send(
            new QueryCommand({
                TableName: process.env.TABLE,
                IndexName: 'PhoneIndex',
                KeyConditionExpression: 'phone = :phone',
                ExpressionAttributeValues: { ':phone': body.phone },
                Limit: 1,
            })
        ),
        docClient.send(
            new QueryCommand({
                TableName: process.env.TABLE,
                IndexName: 'IdentityNumberIndex',
                KeyConditionExpression: 'identityNumber = :idNum',
                ExpressionAttributeValues: { ':idNum': body.identityNumber },
                Limit: 1,
            })
        )
    ]);

    const phoneExists = Boolean(phoneCheck.Items && phoneCheck.Items.length > 0);
    const idExists = Boolean(idCheck.Items && idCheck.Items.length > 0);
    return phoneExists || idExists;
};
