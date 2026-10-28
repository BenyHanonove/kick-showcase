import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function getSalesSummaryByMonth(monthYear) {
  await ensureAuth();

  console.log('MonthYear query passed:', monthYear);

  const response = await api.get(`/sale/summary?monthYear=${monthYear}`);
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
