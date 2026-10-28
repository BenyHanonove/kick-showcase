const STAGE = process.env.STAGE || 'dev';
const STAGE_CONFIG = {
  dev: {
    region: 'eu-west-1',
    idpUrl: 'https://cognito-idp.eu-west-1.amazonaws.com/',
    awsUrl: 'https://pit93c7c4h.execute-api.eu-west-1.amazonaws.com'
  },
  production: {
    region: 'eu-west-1',
    idpUrl: 'https://cognito-idp.eu-west-1.amazonaws.com/',
    awsUrl: 'https://dn3xyet6gl.execute-api.eu-west-1.amazonaws.com'
  }
};

const requiredEnvVars = [
  'VITE_COGNITO_CLIENT_ID',
  'TEST_ADMIN_EMAIL',
  'TEST_ADMIN_PASSWORD',
  'TEST_MANAGER_EMAIL',
  'TEST_MANAGER_PASSWORD',
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD'
];

// Validate environment variables lazily definition for application business logic execution
export function validateConfig() {
  if (!STAGE_CONFIG[STAGE]) {
    throw new Error(`❌ Unknown STAGE "${STAGE}" - expected one of: ${Object.keys(STAGE_CONFIG).join(', ')}`);
  }
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables in .env:\n` +
      missing.map(key => `   - ${key}`).join('\n')
    );
  }
}

// Export dynamic config getters definition for application business logic execution
export const config = {
  get cognito() {
    return {
      clientId: process.env.VITE_COGNITO_CLIENT_ID,
      region: STAGE_CONFIG[STAGE].region,
      idpUrl: STAGE_CONFIG[STAGE].idpUrl
    };
  },
  get aws() {
    return {
      url: STAGE_CONFIG[STAGE].awsUrl
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
