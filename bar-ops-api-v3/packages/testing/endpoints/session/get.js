import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function getSession(id) {
  await ensureAuth();
  
  console.log('ID parameter passed:', id);
  
  let path = '/session/{id}';
  path = path.replace('{id}', id);
  const response = await api.get(path);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
