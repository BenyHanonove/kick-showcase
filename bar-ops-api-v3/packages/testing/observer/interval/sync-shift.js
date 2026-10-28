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

// Poll and retry assertion for async sync processes
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

// Run the shift hours sync test
export async function runSyncTest() {
  await selectUserRoleAndLogin();
  console.log('=== Starting Interval Shift Hours Sync Verification ===');

  const clientPayload = {
    "name": "Sync Test Lounge",
    "brand": "Sync Test Brand",
    "email": null,
    "phone": "0501234567"
  };
  const clientResponse = await createClient(clientPayload);
  const clientId = extractId(clientResponse);

  const sessionPayload = {
    "clientId": clientId,
    "datetime": "2026-06-01T10:00:00Z",
    "name": "Sync Test Shift",
    "peopleAmount": 50,
    "location": "Main Hall",
    "processingFee": 2,
    "type": "hardstyle"
  };
  const sessionResponse = await createSession(sessionPayload);
  const sessionId = extractId(sessionResponse);

  const uniqueId = generateUniqueId();
  const uniquePhone = generateUniquePhone();

  // Create Employee (not a client child - cleaned up manually
  const employeePayload = {
    "firstName": "SYNC TEST",
    "lastName": "SYNC TEST",
    "identityNumber": uniqueId,
    "phone": uniquePhone,
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

  // Assert shift starts with no accumulated hours
  const initialShift = await getShift(shiftId);
  const initialHours = initialShift.data?.data?.totalHours || 0;
  assert.strictEqual(initialHours, 0, 'Shift totalHours must start at 0');

  // Create Interval 1 (12:00 -> 18:00 = 6 hours)
  const interval1Payload = {
    "shiftId": shiftId,
    "sessionId": sessionId,
    "start": "2026-06-01T12:00:00Z",
    "end": "2026-06-01T18:00:00Z"
  };
  const interval1Response = await createInterval(interval1Payload);
  const interval1Id = extractId(interval1Response);

  console.log('Asserting Shift totalHours is synced to 6 (with polling)...');
  await assertWithRetry(async () => {
    const fetchedShift = await getShift(shiftId);
    assert.strictEqual(fetchedShift.data?.data?.totalHours, 6, 'Shift totalHours should sync to 6 after first interval');
  });

  // Create Interval 2 (19:00 -> 21:30 = 2.5 hours)
  const interval2Payload = {
    "shiftId": shiftId,
    "sessionId": sessionId,
    "start": "2026-06-01T19:00:00Z",
    "end": "2026-06-01T21:30:00Z"
  };
  const interval2Response = await createInterval(interval2Payload);
  const interval2Id = extractId(interval2Response);

  console.log('Asserting Shift totalHours is synced to 8.5 (with polling)...');
  await assertWithRetry(async () => {
    const fetchedShift = await getShift(shiftId);
    assert.strictEqual(fetchedShift.data?.data?.totalHours, 8.5, 'Shift totalHours should accumulate to 8.5 after second interval');
  });

  console.log(`Deleting Client: ${clientId}...`);
  await deleteClient(clientId);

  // Verify the full cascade chain: client -> session -> shift -> intervals
  await assertCascadeDeleted('Session', () => getSession(sessionId));
  await assertCascadeDeleted('Shift', () => getShift(shiftId));
  await assertCascadeDeleted('Interval 1', () => getInterval(interval1Id));
  await assertCascadeDeleted('Interval 2', () => getInterval(interval2Id));

  await deleteEmployee(employeeId);

  console.log('=== Interval Shift Hours Sync Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runSyncTest();
}
