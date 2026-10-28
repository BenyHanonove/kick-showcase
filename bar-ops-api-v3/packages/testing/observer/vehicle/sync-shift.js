import assert from 'assert';
import { createClient } from '../../endpoints/client/create.js';
import { deleteClient } from '../../endpoints/client/delete.js';
import { createSession } from '../../endpoints/session/create.js';
import { getSession } from '../../endpoints/session/get.js';
import { createEmployee } from '../../endpoints/employee/create.js';
import { deleteEmployee } from '../../endpoints/employee/delete.js';
import { createShift } from '../../endpoints/shift/create.js';
import { getShift } from '../../endpoints/shift/get.js';
import { createVehicle } from '../../endpoints/vehicle/create.js';
import { getVehicle } from '../../endpoints/vehicle/get.js';
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

// Run the vehicle shift bonus sync test
export async function runSyncTest() {
  await selectUserRoleAndLogin();
  console.log('=== Starting Vehicle Shift Bonus Sync Verification ===');

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

  // Create Shift (driver) - bonusTravel starts at 10
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

  // Create Vehicle driven by the shift (sum syncs to the
  const vehiclePayload = {
    sessionId: sessionId,
    driverShiftId: shiftId,
    sum: 120,
    desc: "Sync Test Vehicle",
    licensePlate: "12-345-67"
  };
  const vehicleResponse = await createVehicle(vehiclePayload);
  const vehicleId = extractId(vehicleResponse);

  // Assert shift bonusTravel synced to the vehicle sum (SET overrides
  console.log('Asserting Shift bonusTravel is synced to 120 (with polling)...');
  await assertWithRetry(async () => {
    const fetchedShift = await getShift(shiftId);
    assert.strictEqual(fetchedShift.data?.data?.bonusTravel, 120, 'Shift bonusTravel should sync to 120 after vehicle creation');
  });

  console.log(`Deleting Client: ${clientId}...`);
  await deleteClient(clientId);

  // Verify the cascade chain: client -> session -> shift + vehicle
  await assertCascadeDeleted('Session', () => getSession(sessionId));
  await assertCascadeDeleted('Shift', () => getShift(shiftId));
  await assertCascadeDeleted('Vehicle', () => getVehicle(vehicleId));

  await deleteEmployee(employeeId);

  console.log('=== Vehicle Shift Bonus Sync Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runSyncTest();
}
