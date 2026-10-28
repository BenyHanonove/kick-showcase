import { ensureAuth } from '../../shared/auth-guard.js';
import api from '../../shared/api.js';

export async function notifyEmployee(employeeId, text) {
  await ensureAuth();

  console.log('Notify payload passed:', { employeeId, text });

  const response = await api.post('/employee/notify', { employeeId, text });
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
