import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function getEmployee(id) {
  await ensureAuth();
  
  console.log('ID parameter passed:', id);
  
  const response = await api.get(`/employee?ids=${id}`);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
