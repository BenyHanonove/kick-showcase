// Import external framework dependencies and status codes from third party packages
import { fileURLToPath } from 'url';
import process from 'process';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSession } from '../endpoints/session/create.js';
import { deleteSession } from '../endpoints/session/delete.js';
import { createEmployee } from '../endpoints/employee/create.js';
import { deleteEmployee } from '../endpoints/employee/delete.js';
import { createShift } from '../endpoints/shift/create.js';
import { deleteShift } from '../endpoints/shift/delete.js';
import { createInterval } from '../endpoints/interval/create.js';
import { getInterval } from '../endpoints/interval/get.js';
import { listIntervals } from '../endpoints/interval/list.js';
import { updateInterval } from '../endpoints/interval/update.js';
import { deleteInterval } from '../endpoints/interval/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { generateUniqueId, generateUniquePhone, extractId, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

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
    phone: generateUniquePhone(),
    type: 'waiter'
  });
  const employeeId = extractId(employeeResponse);

  const shiftResponse = await createShift({
    sessionId: sessionId,
    employeeId: employeeId,
    role: 'waiter',
    timing: '2026-06-01T09:00:00.000Z',
    bonusTravel: 10,
    bonusManage: 15,
    bonusOther: 5
  });
  const shiftId = extractId(shiftResponse);

  return { clientId, sessionId, employeeId, shiftId };
}

// Admin deletes the fixtures (shift delete is admin-only)
async function deleteFixtures({ clientId, sessionId, employeeId, shiftId }) {
  await deleteShift(shiftId);
  await deleteEmployee(employeeId);
  await deleteSession(sessionId);
  await deleteClient(clientId);
}

// User must 403 on every interval op configuration setting for
async function runUserChecks() {
  console.log('Running interval 403 checks as user...');
  const payload = { shiftId: fakeId(), sessionId: fakeId(), start: '2026-06-01T12:00:00Z', end: '2026-06-01T18:00:00Z' };
  await assertForbidden(() => createInterval(payload), 'interval create as user');
  await assertForbidden(() => getInterval(fakeId()), 'interval get as user');
  await assertForbidden(() => listIntervals({ shiftId: fakeId() }), 'interval list as user');
  await assertForbidden(() => updateInterval(fakeId(), payload), 'interval update as user');
  await assertForbidden(() => deleteInterval(fakeId()), 'interval delete as user');
  console.log('All interval 403 checks passed');
}

// Full interval flow for a role; fixtures are admin-only
async function runIntervalFlow() {
  const fixtures = await asAdmin(createFixtures);

  try {
    const intervalPayload = {
      "shiftId": fixtures.shiftId,
      "sessionId": fixtures.sessionId,
      "start": "2026-06-01T12:00:00Z",
      "end": "2026-06-01T18:00:00Z"
    };
    const intervalResponse = await createInterval(intervalPayload);
    const intervalId = extractId(intervalResponse);

    const fetchedInterval = await getInterval(intervalId);
    let intervalTimestamp = new Date().toISOString();
    if (fetchedInterval.data && fetchedInterval.data.data && fetchedInterval.data.data.timestamp) {
      intervalTimestamp = fetchedInterval.data.data.timestamp;
    }

    await listIntervals({ shiftId: fixtures.shiftId });

    const updatePayload = {
      "start": "2026-06-01T12:00:00Z",
      "end": "2026-06-01T19:00:00Z",
      "timestamp": intervalTimestamp
    };
    await updateInterval(intervalId, updatePayload);

    await deleteInterval(intervalId);
  } finally {
    await asAdmin(() => deleteFixtures(fixtures));
  }
}

// Run entire interval lifecycle sequence configuration setting for module execution
export async function runIntervalLifecycle() {
  console.log('=== Starting Interval Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else {
    // Interval is fully admin+manager: same flow for both roles
    await runIntervalFlow();
  }

  console.log('=== Interval Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runIntervalLifecycle();
}
