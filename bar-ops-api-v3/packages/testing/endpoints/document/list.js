import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function listDocuments(filters) {
  await ensureAuth();

  let query = '';
  if (filters) {
    const params = new URLSearchParams();
    if (Array.isArray(filters)) {
      const len = filters.length;
      let i = 0;
      while (i < len) {
        params.append('filters', filters[i]);
        i = i + 1;
      }
    } else if (typeof filters === 'object') {
      const keys = Object.keys(filters);
      const len = keys.length;
      let i = 0;
      while (i < len) {
        const key = keys[i];
        const val = filters[key];
        if (val !== undefined && val !== null) {
          params.append(key, val);
        }
        i = i + 1;
      }
    } else {
      params.append('filters', filters);
    }
    const qStr = params.toString();
    if (qStr.length > 0) {
      query = '?' + qStr;
    }
  }
  console.log('Query parameters passed:', query);

  const response = await api.get(`/document${query}`);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
