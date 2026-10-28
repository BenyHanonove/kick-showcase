// Import external framework dependencies and status codes from third party packages
import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function linkEmployee(id) {
  await ensureAuth();

  console.log('ID parameter passed:', id);

  let path = '/employee/link/{id}';
  path = path.replace('{id}', id);
  const response = await api.post(path);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
