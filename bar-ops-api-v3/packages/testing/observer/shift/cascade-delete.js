// Import external framework dependencies and status codes from third party packages
import assert from 'assert';
import { createClient } from '../../endpoints/client/create.js';
import { deleteClient } from '../../endpoints/client/delete.js';
import { createSession } from '../../endpoints/session/create.js';
import { getSession } from '../../endpoints/session/get.js';
import { createEmployee } from '../../endpoints/employee/create.js';
import { deleteEmployee } from '../../endpoints/employee/delete.js';
import { createShift } from '../../endpoints/shift/create.js';
import { getShift } from '../../endpoints/shift/get.js';
import { selectUserRoleAndLogin } from '../../shared/select-role.js';
import { generateUniqueId, generateUniquePhone } from '../../shared/utils.js';

function extractId(response) {
  let id = 'mock_id';
  if (response.data) {
    if (response.data.data) {
      if (response.data.data.id) {
        id = response.data.data.id;
      }
    } else if (response.data.id) {
      id = response.data.id;
    }
  }
  return id;
}

// Poll and retry assertion for async processes configuration setting for
async function assertWithRetry(assertionFn, maxTimeoutMs = 30000, intervalMs = 2000) {
  const startTime = Date.now();
  while (true) {
    try {
      await assertionFn();
      return;
    } catch (error) {
      if (Date.now() - startTime > maxTimeoutMs) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}

// Assert entity returns 404 after cascade deletion (with polling)
async function assertCascadeDeleted(name, fetchFn) {
  console.log(`Verifying ${name} is cascade-deleted (with polling)...`);
  await assertWithRetry(async () => {
    let deleted = false;
    try {
      await fetchFn();
    } catch (error) {
      if (error.status === 404) {
        deleted = true;
      } else {
        throw error;
      }
    }
    assert.ok(deleted, `${name} should have been cascade-deleted after client deletion`);
  });
}

// Run the cascade delete test configuration setting for module execution
export async function runCascadeDeleteTest() {
  await selectUserRoleAndLogin();
  console.log('=== Starting Shift Cascade Delete Verification ===');

  const clientPayload = {
    "name": "Cascade Test Lounge",
    "brand": "Cascade Test Brand",
    "email": null,
    "phone": "0507799799"
  };
  const clientResponse = await createClient(clientPayload);
  const clientId = extractId(clientResponse);

  const sessionPayload = {
    "clientId": clientId,
    "datetime": "2026-06-01T10:00:00Z",
    "name": "Cascade Test Shift",
    "peopleAmount": 50,
    "location": "Main Hall",
    "processingFee": 2,
    "type": "hardstyle"
  };
  const sessionResponse = await createSession(sessionPayload);
  const sessionId = extractId(sessionResponse);

  // Create Employee (not a client child - cleaned up manually
  // Unique identity/phone per run so a failed run's leftovers can't cause 409s
  const employeePayload = {
    "firstName": "CASCADE TEST",
    "lastName": "CASCADE TEST",
    "identityNumber": generateUniqueId(),
    "phone": generateUniquePhone(),
    "type": "waiter"
  };
  const employeeResponse = await createEmployee(employeePayload);
  const employeeId = extractId(employeeResponse);

  const shiftPayload = {
    "sessionId": sessionId,
    "employeeId": employeeId,
    "role": "waiter",
    "timing": "2026-06-01T09:00:00.000Z",
    "bonusTravel": 10,
    "bonusManage": 15,
    "bonusOther": 5
  };
  const shiftResponse = await createShift(shiftPayload);
  const shiftId = extractId(shiftResponse);

  // Verify session and shift can be fetched before deletion
  await getSession(sessionId);
  await getShift(shiftId);

  console.log(`Deleting Client: ${clientId}...`);
  await deleteClient(clientId);

  // Verify the cascade chain: client -> session -> shift
  await assertCascadeDeleted('Session', () => getSession(sessionId));
  await assertCascadeDeleted('Shift', () => getShift(shiftId));

  await deleteEmployee(employeeId);

  console.log('=== Shift Cascade Delete Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCascadeDeleteTest();
}
