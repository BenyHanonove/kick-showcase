const REGION = process.env.AWS_REGION || 'eu-west-1';

const requiredEnvVars = [
  'API_BASE_URL',
  'VITE_COGNITO_CLIENT_ID',
  'TEST_ADMIN_EMAIL',
  'TEST_ADMIN_PASSWORD',
  'TEST_MANAGER_EMAIL',
  'TEST_MANAGER_PASSWORD',
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD'
];

// Validate environment variables lazily
export function validateConfig() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables in .env:\n` +
      missing.map(key => `   - ${key}`).join('\n')
    );
  }
}

// Export dynamic config getters
export const config = {
  get cognito() {
    return {
      clientId: process.env.VITE_COGNITO_CLIENT_ID,
      region: REGION,
      idpUrl: `https://cognito-idp.${REGION}.amazonaws.com/`
    };
  },
  get aws() {
    return {
      // HTTP API base URL of the stage under test, e.g. https://<api-id>.execute-api.<region>.amazonaws.com
      url: process.env.API_BASE_URL
    };
  },
  get auth() {
    return {
      admin: {
        email: process.env.TEST_ADMIN_EMAIL,
        password: process.env.TEST_ADMIN_PASSWORD
      },
      manager: {
        email: process.env.TEST_MANAGER_EMAIL,
        password: process.env.TEST_MANAGER_PASSWORD
      },
      user: {
        email: process.env.TEST_USER_EMAIL,
        password: process.env.TEST_USER_PASSWORD
      }
    };
  }
};
