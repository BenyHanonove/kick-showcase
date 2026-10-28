// Import external framework dependencies and status codes from third party packages
import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function getCashier(id) {
  await ensureAuth();
  
  console.log('Cashier ID passed:', id);
  
  const response = await api.get(`/cashier/${id}`);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
