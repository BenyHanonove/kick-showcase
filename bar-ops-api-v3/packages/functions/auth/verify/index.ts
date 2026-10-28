// Import external framework dependencies and status codes from third party packages
import { VerifyAuthChallengeResponseTriggerEvent } from 'aws-lambda';
import { timingSafeEqual } from 'crypto';

const safeCompare = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual needs equal lengths; mismatch rejects safely configuration setting for
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

// Process auth verify operation request and return JSON HTTP response
export const handler = async (event: VerifyAuthChallengeResponseTriggerEvent): Promise<VerifyAuthChallengeResponseTriggerEvent> => {
  const expectedAnswer = event.request.privateChallengeParameters.secretLoginCode;
  const givenAnswer = event.request.challengeAnswer;

  event.response.answerCorrect =
    typeof expectedAnswer === 'string' &&
    typeof givenAnswer === 'string' &&
    safeCompare(givenAnswer, expectedAnswer);

  return event;
};
