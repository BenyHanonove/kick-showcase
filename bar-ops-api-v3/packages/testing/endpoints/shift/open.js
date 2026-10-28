import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function openShiftRegistration(sessionId, employeeId) {
  await ensureAuth();

  console.log('ID parameter passed:', sessionId);

  const body = { employeeId };
  console.log('Request body passed:', body);

  let path = '/shift/open/{sessionId}';
  path = path.replace('{sessionId}', sessionId);
  const response = await api.post(path, body);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
