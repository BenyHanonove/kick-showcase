import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function createMission(payload) {
  await ensureAuth();

  console.log('Request body passed:', payload);

  const response = await api.post('/mission', payload);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
