import assert from 'assert';
import { createClient } from '../../endpoints/client/create.js';
import { deleteClient } from '../../endpoints/client/delete.js';
import { createSession } from '../../endpoints/session/create.js';
import { getSession } from '../../endpoints/session/get.js';
import { createEmployee } from '../../endpoints/employee/create.js';
import { deleteEmployee } from '../../endpoints/employee/delete.js';
import { createShift } from '../../endpoints/shift/create.js';
import { getShift } from '../../endpoints/shift/get.js';
import { createInterval } from '../../endpoints/interval/create.js';
import { getInterval } from '../../endpoints/interval/get.js';
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

// Poll and retry assertion for async processes
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

// Run the cascade delete test
export async function runCascadeDeleteTest() {
  await selectUserRoleAndLogin();
  console.log('=== Starting Interval Cascade Delete Verification ===');

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

  const intervalPayload = {
    "shiftId": shiftId,
    "sessionId": sessionId,
    "start": "2026-06-01T12:00:00Z",
    "end": "2026-06-01T18:00:00Z"
  };
  const intervalResponse = await createInterval(intervalPayload);
  const intervalId = extractId(intervalResponse);

  // Verify session, shift and interval can be fetched before deletion
  await getSession(sessionId);
  await getShift(shiftId);
  await getInterval(intervalId);

  console.log(`Deleting Client: ${clientId}...`);
  await deleteClient(clientId);

  // Verify the full cascade chain: client -> session -> shift -> interval
  await assertCascadeDeleted('Session', () => getSession(sessionId));
  await assertCascadeDeleted('Shift', () => getShift(shiftId));
  await assertCascadeDeleted('Interval', () => getInterval(intervalId));

  await deleteEmployee(employeeId);

  console.log('=== Interval Cascade Delete Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCascadeDeleteTest();
}
