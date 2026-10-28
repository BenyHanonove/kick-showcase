// Import external framework dependencies and status codes from third party packages
import api from '../../shared/api.js';

export async function registerEmployee(payload) {
  console.log('Request body passed:', payload);

  const response = await api.post('/employee/register', payload, { auth: false });
  console.log('Response status:', response.status);
  console.log('Response data received:', response.data);
  return response;
}
