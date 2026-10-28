// Import external framework dependencies and status codes from third party packages
import api from '../../shared/api.js';

export async function resolveEmployeeLink(token) {
  const body = { token };
  console.log('Request body passed:', body);

  const response = await api.post('/employee/resolve', body, { auth: false });
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
