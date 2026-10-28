// Import external framework dependencies and status codes from third party packages
import { DefineAuthChallengeTriggerEvent } from 'aws-lambda';

// Process auth define operation request and return JSON HTTP response
export const handler = async (event: DefineAuthChallengeTriggerEvent): Promise<DefineAuthChallengeTriggerEvent> => {
  const session = event.request.session;

  if (session && session.length > 0 && session.slice(-1)[0].challengeResult === true) {
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
  } else if (session && session.length >= 3) {
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
  } else {
    // Initial attempt or retry after a failed attempt
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
  }

  return event;
};