import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function getSupplierSummary(id, monthYear) {
  await ensureAuth();
  
  console.log('ID parameter passed:', id);
  console.log('MonthYear query passed:', monthYear);
  
  let path = '/supplier/summary/{id}';
  path = path.replace('{id}', id);
  
  let query = '';
  if (monthYear) {
    query = '?monthYear=' + monthYear;
  }
  
  const response = await api.get(path + query);
  console.log('Response status:', response.status);
  if (typeof response.data === 'string' && response.data.startsWith('%PDF')) {
    console.log('Response data received: <PDF Document: ' + response.data.length + ' bytes>');
  } else {
    console.log('Response data received:', response.data);
  }
  return response;
}
