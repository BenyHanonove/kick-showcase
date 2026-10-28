import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function revokeShiftRegistration(sessionId) {
  await ensureAuth();

  console.log('ID parameter passed:', sessionId);

  let path = '/shift/revoke/{sessionId}';
  path = path.replace('{sessionId}', sessionId);
  const response = await api.post(path);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
