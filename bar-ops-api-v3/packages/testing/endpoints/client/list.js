import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function listClients(ids) {
  await ensureAuth();
  
  let query = '';
  if (ids) {
    const params = new URLSearchParams();
    if (Array.isArray(ids)) {
      const len = ids.length;
      let i = 0;
      while (i < len) {
        params.append('ids', ids[i]);
        i = i + 1;
      }
    } else if (typeof ids === 'object') {
      const keys = Object.keys(ids);
      const len = keys.length;
      let i = 0;
      while (i < len) {
        const key = keys[i];
        const val = ids[key];
        if (val !== undefined && val !== null) {
          params.append(key, val);
        }
        i = i + 1;
      }
    } else {
      params.append('ids', ids);
    }
    const qStr = params.toString();
    if (qStr.length > 0) {
      query = '?' + qStr;
    }
  }
  console.log('Query parameters passed:', query);
  
  const response = await api.get(`/client${query}`);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
