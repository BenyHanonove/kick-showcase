import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function getSaleSummary(id) {
  await ensureAuth();
  
  console.log('ID parameter passed:', id);
  
  let path = '/sale/summary/{saleId}';
  path = path.replace('{saleId}', id);
  const response = await api.get(path);
  console.log('Response status:', response.status);
  if (typeof response.data === 'string' && response.data.startsWith('%PDF')) {
    console.log('Response data received: <PDF Document: ' + response.data.length + ' bytes>');
  } else {
    console.log('Response data received:', response.data);
  }
  return response;
}
