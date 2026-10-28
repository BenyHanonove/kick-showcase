import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSession } from '../endpoints/session/create.js';
import { deleteSession } from '../endpoints/session/delete.js';
import { createEmployee } from '../endpoints/employee/create.js';
import { deleteEmployee } from '../endpoints/employee/delete.js';
import { createShift } from '../endpoints/shift/create.js';
import { getShift } from '../endpoints/shift/get.js';
import { listShifts } from '../endpoints/shift/list.js';
import { updateShift } from '../endpoints/shift/update.js';
import { deleteShift } from '../endpoints/shift/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { generateUniqueId, VERIFIED_TEST_PHONE, extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden, assertFieldsDropped } from '../shared/role-assert.js';
import { managerDrops } from '../shared/role-matrix.js';

const SHIFT_DROPS = managerDrops('shift');

// Admin creates the client/session/employee fixtures shifts depend on
async function createFixtures() {
  const clientResponse = await createClient({ name: 'TEST', brand: 'TEST', email: null, phone: '0507799799' });
  const clientId = extractId(clientResponse);

  const sessionResponse = await createSession({
    clientId: clientId,
    datetime: '2026-06-01T10:00:00Z',
    name: 'TEST',
    peopleAmount: 50,
    location: 'TEST',
    processingFee: 2,
    type: 'hardstyle'
  });
  const sessionId = extractId(sessionResponse);

  const employeeResponse = await createEmployee({
    firstName: 'TEST',
    lastName: 'TEST',
    identityNumber: generateUniqueId(),
    // Shift notification sends a real WhatsApp message, so this must be the allow-listed number
    phone: VERIFIED_TEST_PHONE,
    type: 'waiter'
  });
  const employeeId = extractId(employeeResponse);

  return { clientId, sessionId, employeeId };
}

async function deleteFixtures({ clientId, sessionId, employeeId }) {
  await deleteEmployee(employeeId);
  await deleteSession(sessionId);
  await deleteClient(clientId);
}

// User must 403 on every shift op
async function runUserChecks() {
  console.log('Running shift 403 checks as user...');
  const payload = { sessionId: fakeId(), employeeId: fakeId(), role: 'waiter', timing: '2026-06-01T09:00:00.000Z' };
  await assertForbidden(() => createShift(payload), 'shift create as user');
  await assertForbidden(() => getShift(fakeId()), 'shift get as user');
  await assertForbidden(() => listShifts({ sessionId: fakeId() }), 'shift list as user');
  await assertForbidden(() => updateShift(fakeId(), payload), 'shift update as user');
  await assertForbidden(() => deleteShift(fakeId()), 'shift delete as user');
  console.log('All shift 403 checks passed');
}

// Manager: full lifecycle with bonus fields dropped and update-strip verified
async function runManagerChecks() {
  console.log('Running shift manager checks...');
  await assertForbidden(() => deleteShift(fakeId()), 'shift delete as manager');

  const fixtures = await asAdmin(createFixtures);
  let shiftId = null;

  try {
    // Manager create: bonus values are stored but dropped from the response
    const shiftResponse = await createShift({
      sessionId: fixtures.sessionId,
      employeeId: fixtures.employeeId,
      role: 'waiter',
      timing: '2026-06-01T09:00:00.000Z',
      bonusTravel: 10,
      bonusManage: 15,
      bonusOther: 5
    });
    shiftId = extractId(shiftResponse);
    assertFieldsDropped(extractData(shiftResponse), SHIFT_DROPS, 'shift create as manager');

    const fetchedShift = extractData(await getShift(shiftId));
    assertFieldsDropped(fetchedShift, SHIFT_DROPS, 'shift get as manager');
    const shiftTimestamp = fetchedShift.timestamp;

    const shifts = extractData(await listShifts({ sessionId: fixtures.sessionId }));
    assert.ok(Array.isArray(shifts) && shifts.some(s => s.id === shiftId), 'shift list as manager should contain the shift');
    for (const s of shifts) {
      assertFieldsDropped(s, SHIFT_DROPS, 'shift list row as manager');
    }

    // Manager update sends bonus fields; the server must strip them
    const updateResponse = await updateShift(shiftId, {
      role: 'waiter',
      timing: '2026-06-01T09:00:00.000Z',
      bonusTravel: 999,
      bonusManage: 999,
      bonusOther: 999,
      timestamp: shiftTimestamp
    });
    assertFieldsDropped(extractData(updateResponse), SHIFT_DROPS, 'shift update response as manager');

    // Admin read-back: bonus values unchanged from creation
    await asAdmin(async () => {
      const adminView = extractData(await getShift(shiftId));
      assert.strictEqual(adminView.bonusTravel, 10, 'bonusTravel should be unchanged after manager update');
      assert.strictEqual(adminView.bonusManage, 15, 'bonusManage should be unchanged after manager update');
      assert.strictEqual(adminView.bonusOther, 5, 'bonusOther should be unchanged after manager update');
    });
  } finally {
    await asAdmin(async () => {
      if (shiftId) await deleteShift(shiftId);
      await deleteFixtures(fixtures);
    });
  }
  console.log('All shift manager checks passed');
}

async function runAdminLifecycle() {
  const fixtures = await createFixtures();

  const shiftPayload = {
    "sessionId": fixtures.sessionId,
    "employeeId": fixtures.employeeId,
    "role": "waiter",
    "timing": "2026-06-01T09:00:00.000Z",
    "bonusTravel": 10,
    "bonusManage": 15,
    "bonusOther": 5
  };
  const shiftResponse = await createShift(shiftPayload);
  const shiftId = extractId(shiftResponse);
  assert.strictEqual(extractData(shiftResponse).registration, 'APPROVED', 'a manager-created shift is approved');

  const fetchedShift = await getShift(shiftId);
  let shiftTimestamp = new Date().toISOString();
  if (fetchedShift.data && fetchedShift.data.data && fetchedShift.data.data.timestamp) {
    shiftTimestamp = fetchedShift.data.data.timestamp;
  }

  await listShifts({ sessionId: fixtures.sessionId });

  const updatePayload = {
    "role": "waiter",
    "timing": "2026-06-01T09:00:00.000Z",
    "bonusTravel": 15,
    "bonusManage": 15,
    "bonusOther": 10,
    "timestamp": shiftTimestamp
  };
  await updateShift(shiftId, updatePayload);

  await deleteShift(shiftId);

  await deleteFixtures(fixtures);
}

// Run entire shift lifecycle sequence
export async function runShiftLifecycle() {
  console.log('=== Starting Shift Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else if (role === 'manager') {
    await runManagerChecks();
  } else {
    await runAdminLifecycle();
  }

  console.log('=== Shift Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runShiftLifecycle();
}
