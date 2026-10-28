// Import external framework dependencies and status codes from third party packages
import { CreateAuthChallengeTriggerEvent } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as crypto from 'crypto';

// Import shared AWS services, guard security middleware, and utility helpers
import { logger } from '@utils/logger/logger.util';

const ses = new SESClient({});

// Create new auth record in DynamoDB database and return created resource DTO
export const handler = async (event: CreateAuthChallengeTriggerEvent): Promise<CreateAuthChallengeTriggerEvent> => {
  let secretLoginCode: string;

  // Generate new code if no active session configuration setting for
  if (!event.request.session || event.request.session.length === 0) {
    secretLoginCode = crypto.randomInt(100000, 999999).toString();
  }
  else {
    const previousChallenge = event.request.session.slice(-1)[0];
    const match = previousChallenge.challengeMetadata?.match(/CODE-(\d+)/);
    secretLoginCode = match ? match[1] : crypto.randomInt(100000, 999999).toString();
  }

  const params = {
    Source: process.env.SES_FROM_ADDRESS!,
    Destination: { ToAddresses: [event.request.userAttributes.email] },
    Message: {
      Subject: { Data: "Your Login Code" },
      Body: { Text: { Data: `Your code: ${secretLoginCode}` } }
    }
  };

  try {
    await ses.send(new SendEmailCommand(params));
  } catch (error) {
    logger.error(error);
  }

  event.response.publicChallengeParameters = { email: event.request.userAttributes.email };
  event.response.privateChallengeParameters = { secretLoginCode };
  event.response.challengeMetadata = `CODE-${secretLoginCode}`;

  return event;
};