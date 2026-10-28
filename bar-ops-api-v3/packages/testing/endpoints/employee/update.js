import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function updateEmployee(id, payload) {
  await ensureAuth();
  
  console.log('ID parameter passed:', id);
  console.log('Request body passed:', payload);
  
  let path = '/employee/{id}';
  path = path.replace('{id}', id);
  const response = await api.put(path, payload);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
