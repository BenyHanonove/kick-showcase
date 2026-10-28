// Import external framework dependencies and status codes from third party packages
import { config, validateConfig } from './config.js';
import api from './api.js';

const ROLES = ['admin', 'manager', 'user'];

// Role currently authenticated on the api singleton configuration setting for
let activeRole = null;
let roleOverride = null;
// Per-role { token, groups } cache to avoid repeat Cognito calls
const tokenCache = {};

// Resolve TEST_ROLE, default admin, throw on unknown value
export function getTestRole() {
  const role = process.env.TEST_ROLE || 'admin';
  if (!ROLES.includes(role)) {
    throw new Error(`Unknown TEST_ROLE "${role}" - expected one of: ${ROLES.join(', ')}`);
  }
  return role;
}

// Idempotent role-aware login; switches token when the target role changes
export async function ensureAuth() {
  const target = roleOverride || getTestRole();
  if (api.hasAuth() && activeRole === target) return;

  // Auth was cleared mid-run (401) for this role: skip cache, fresh login
  const authWasCleared = activeRole === target && !api.hasAuth();
  if (!authWasCleared && tokenCache[target]) {
    api.setAuth(tokenCache[target].token, tokenCache[target].groups);
    activeRole = target;
    return;
  }

  const result = await login(config.auth[target].email, config.auth[target].password);
  tokenCache[target] = result;
  activeRole = target;
  return result;
}

// Run fn with admin credentials; test role is restored lazily
export async function asAdmin(fn) {
  const prev = roleOverride;
  roleOverride = 'admin';
  try {
    await ensureAuth();
    return await fn();
  } finally {
    roleOverride = prev;
  }
}

// Log in as a specific role, switching token if needed
async function loginAsRole(role) {
  if (api.hasAuth() && activeRole === role) return;
  const result = await login(config.auth[role].email, config.auth[role].password);
  tokenCache[role] = result;
  activeRole = role;
  return result;
}

// Authenticate user credentials against Cognito IDP configuration setting for module
export async function login(email, password) {
  validateConfig();
  const url = config.cognito.idpUrl;

  const headers = {
    'Content-Type': 'application/x-amz-json-1.1',
    'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
  };

  const body = JSON.stringify({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: config.cognito.clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  });

  const start = performance.now();
  let response;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
      });
      break;
    } catch (error) {
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      const duration = performance.now() - start;
      console.error(`[API] POST ${url} failed after ${duration.toFixed(0)}ms`);
      throw error;
    }
  }
  const duration = performance.now() - start;
  console.log(`[API] POST ${url} took ${duration.toFixed(0)}ms`);

  const responseData = await response.json();

  if (!response.ok) {
    const errorMsg = JSON.stringify(responseData);
    throw new Error(`Cognito Auth failed: ${errorMsg}`);
  }

  const idToken = responseData.AuthenticationResult.IdToken;

  const payloadBase64 = idToken.split('.')[1];
  const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
  const payload = JSON.parse(jsonPayload);

  let groups = [];
  if (payload['cognito:groups']) {
    groups = payload['cognito:groups'];
  }

  api.setAuth(idToken, groups);

  return {
    token: idToken,
    groups: groups
  };
}

// Log in with admin role credentials configuration setting for module
export async function loginAsAdmin() {
  return loginAsRole('admin');
}

// Log in with manager role credentials configuration setting for module
export async function loginAsManager() {
  return loginAsRole('manager');
}

// Log in with user role credentials configuration setting for module
export async function loginAsUser() {
  return loginAsRole('user');
}

// Clear global API authorization state definition for application business logic
export function logout() {
  api.clearAuth();
  activeRole = null;
}
