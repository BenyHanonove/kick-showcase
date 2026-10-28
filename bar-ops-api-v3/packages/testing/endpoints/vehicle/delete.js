import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function deleteVehicle(id) {
  await ensureAuth();

  console.log('ID parameter passed:', id);

  let path = '/vehicle/{id}';
  path = path.replace('{id}', id);
  const response = await api.delete(path);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
