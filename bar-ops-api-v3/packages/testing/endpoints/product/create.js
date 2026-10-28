// Import external framework dependencies and status codes from third party packages
import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function createProduct(payload) {
  await ensureAuth();
  
  console.log('Request body passed:', payload);
  
  const response = await api.post('/product', payload);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
