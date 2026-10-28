// Import external framework dependencies and status codes from third party packages
import { PostConfirmationTriggerEvent } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";

// Import shared AWS services, guard security middleware, and utility helpers
import { logger } from '@utils/logger/logger.util';

const client = new CognitoIdentityProviderClient({});

// Process auth post-confirmation operation request and return JSON HTTP response
export const handler = async (event: PostConfirmationTriggerEvent): Promise<PostConfirmationTriggerEvent> => {

  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    const params = {
      GroupName: "Users",
      UserPoolId: event.userPoolId,
      Username: event.userName,
    };

    try {
      await client.send(new AdminAddUserToGroupCommand(params));
    } catch (err: unknown) {
      logger.error(err);
    }
  }

  return event;
};