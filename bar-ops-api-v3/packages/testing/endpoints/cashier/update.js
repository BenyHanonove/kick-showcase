import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function updateCashier(id, payload) {
  await ensureAuth();
  
  console.log('Cashier ID passed:', id);
  console.log('Request body passed:', payload);
  
  const response = await api.put(`/cashier/${id}`, payload);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
