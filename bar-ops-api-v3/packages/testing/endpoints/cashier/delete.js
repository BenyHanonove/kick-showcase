import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function deleteCashier(id) {
  await ensureAuth();
  
  console.log('Cashier ID passed:', id);
  
  const response = await api.delete(`/cashier/${id}`);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
