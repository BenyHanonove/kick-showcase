import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function listCashiers(filters) {
  await ensureAuth();
  
  let query = '';
  if (filters) {
    query = '?sessionId=' + filters.sessionId;
  }
  console.log('Query parameters passed:', query);
  
  const response = await api.get(`/cashier${query}`);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
