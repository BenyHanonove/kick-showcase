import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSession } from '../endpoints/session/create.js';
import { getSession } from '../endpoints/session/get.js';
import { updateSession } from '../endpoints/session/update.js';
import { deleteSession } from '../endpoints/session/delete.js';
import { createEmployee } from '../endpoints/employee/create.js';
import { deleteEmployee } from '../endpoints/employee/delete.js';
import { listShifts } from '../endpoints/shift/list.js';
import { deleteShift } from '../endpoints/shift/delete.js';
import { createShift } from '../endpoints/shift/create.js';
import { updateShift } from '../endpoints/shift/update.js';
import { openShiftRegistration } from '../endpoints/shift/open.js';
import { resolveShiftRegistration } from '../endpoints/shift/resolve.js';
import { registerShift } from '../endpoints/shift/register.js';
import { revokeShiftRegistration } from '../endpoints/shift/revoke.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole } from '../shared/auth-guard.js';
import { generateUniqueId, VERIFIED_TEST_PHONE, extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';
import { managerDrops } from '../shared/role-matrix.js';

const PAY_DROPS = managerDrops('shift');

const SESSION_DATETIME = '2026-06-01T10:00:00Z';

// Staffing counts no longer gate the picker, but a realistic
const SESSION_CAPACITY = { waitersAmount: 2, barmanAmount: 1 };

async function assertRejects(fn, status, label) {
  let error = null;
  try {
    await fn();
  } catch (err) {
    error = err;
  }
  assert.ok(error, `${label}: expected ${status} but request succeeded`);
  assert.strictEqual(error.status, status, `${label}: expected ${status} but got ${error.status ?? error.message}`);
}

// Session get may return a row or a single object,
function findSession(response, id) {
  const data = extractData(response);
  if (Array.isArray(data)) return data.find(session => session.id === id);
  return data;
}

// Admin creates the client/session/employee the registration flow needs
async function createFixtures() {
  const clientId = extractId(await createClient({ name: 'TEST', brand: 'TEST', email: null, phone: '0501234567' }));

  const sessionId = extractId(await createSession({
    clientId,
    datetime: SESSION_DATETIME,
    name: 'TEST',
    peopleAmount: 50,
    location: 'TEST',
    processingFee: 2,
    type: 'hardstyle'
  }));

  // Staffing counts only exist on update, so open the roles
  const session = findSession(await getSession(sessionId), sessionId);

  // Update normalizes datetime to a date-only string, so the stored
  // from the update itself - the pre-update copy still carries
  const updated = extractData(await updateSession(sessionId, { ...SESSION_CAPACITY, timestamp: session.timestamp }));

  const employeeId = extractId(await createEmployee({
    firstName: 'TEST',
    lastName: 'TEST',
    identityNumber: generateUniqueId(),
    // Opening registration sends a real WhatsApp message, so this must
    phone: VERIFIED_TEST_PHONE,
    type: 'waiter'
  }));

  return { clientId, sessionId, employeeId, sessionDatetime: updated.datetime };
}

async function deleteFixtures({ clientId, sessionId, employeeId }) {
  await deleteEmployee(employeeId);
  await deleteSession(sessionId);
  await deleteClient(clientId);
}

// Opening registration mints one token for the invited employee
function extractToken(openResponse) {
  const data = extractData(openResponse);

  // Delivery depends on the shift_availability_request template being approved in "he"
  // on the Meta account, which is outside this stage's control.
  // the outcome, so only the flag's presence is asserted, never
  assert.strictEqual(typeof data.sent, 'boolean', 'open should report whether the template was sent');
  assert.ok(data.token, 'open should return the registration token');
  assert.ok(data.expiresAt, 'open should report when the token dies');

  return data.token;
}

// Non-admin roles: opening and closing registration is admin-only, the token
async function runForbiddenChecks(role) {
  console.log(`Running shift-registration 403 checks as ${role}...`);
  await assertForbidden(() => openShiftRegistration(fakeId(), fakeId()), `shift open as ${role}`);
  await assertForbidden(() => revokeShiftRegistration(fakeId()), `shift revoke as ${role}`);

  await assertRejects(() => resolveShiftRegistration('not-a-real-token'), 400, `shift resolve as ${role}`);
  await assertRejects(() => registerShift('not-a-real-token', { role: 'waiter' }), 400, `shift register as ${role}`);

  console.log(`All shift-registration ${role} checks passed`);
}

// Full open -> resolve -> register flow as admin
async function runAdminLifecycle() {
  const fixtures = await createFixtures();
  let shiftId = null;

  try {
    // Admin opens registration for this one employee
    const token = extractToken(await openShiftRegistration(fixtures.sessionId, fixtures.employeeId));

    // The employee opens the link: event details only, no ids
    const resolved = extractData(await resolveShiftRegistration(token));
    assert.strictEqual(resolved.employee.firstName, 'TEST', 'resolve should greet the employee by first name');
    assert.strictEqual(resolved.session.name, 'TEST', 'resolve should return the event name');
    assert.strictEqual(resolved.session.brand, 'TEST', 'resolve should return the client brand');
    assert.strictEqual(resolved.session.datetime, fixtures.sessionDatetime, 'resolve should return the event datetime');
    assert.strictEqual(resolved.session.location, 'TEST', 'resolve should return the event location');
    assert.strictEqual(resolved.registered, false, 'a fresh token should report the employee as not yet registered');

    // Roles are picked from the static enum on the page,
    assert.ok(!('roles' in resolved), 'resolve should not send a roles list');

    // The ids the token holds must never reach the employee
    assert.ok(!('sessionId' in resolved), 'resolve should not expose the session id');
    assert.ok(!('employeeId' in resolved), 'resolve should not expose the employee id');

    for (const field of PAY_DROPS) {
      assert.ok(!(field in resolved), `resolve should not expose "${field}"`);
    }

    // The employee registers: the token carries who and which event,
    const registerResponse = await registerShift(token, { role: 'waiter', notes: 'אגיע ב-20:30' });
    assert.strictEqual(registerResponse.status, 201, 'register should create the shift');
    const registered = extractData(registerResponse);
    shiftId = registered.id;
    assert.ok(shiftId, 'register should return the created shift id');
    assert.strictEqual(registered.role, 'waiter', 'register should return the chosen role');
    for (const field of PAY_DROPS) {
      assert.ok(!(field in registered), `register should not expose "${field}"`);
    }

    // Admin read-back: the shift is real, timed to the event,
    const shifts = extractData(await listShifts({ sessionId: fixtures.sessionId }));
    const created = shifts.find(shift => shift.id === shiftId);
    assert.ok(created, 'the registered shift should appear on the session');
    assert.strictEqual(created.employeeId, fixtures.employeeId, 'the shift should belong to the token holder');
    assert.strictEqual(created.role, 'waiter', 'the shift should carry the chosen role');
    assert.ok(!created.timing, 'a self-registered shift has no timing until the manager sets it');
    assert.strictEqual(created.approved, false, 'a self-registered shift starts with unverified hours');
    assert.strictEqual(created.registration, 'PENDING', 'a self-registered shift waits for a manager');
    assert.strictEqual(created.notes, 'אגיע ב-20:30', 'notes should reach the shift record');

    // Single use: the same token cannot register twice
    await assertRejects(() => registerShift(token, { role: 'waiter' }), 400, 'reusing a spent token');

    await assertRejects(() => resolveShiftRegistration('not-a-real-token'), 400, 'resolving an unknown token');

    // Any existing shift blocks a new invite: no token, no WhatsApp
    await assertRejects(() => openShiftRegistration(fixtures.sessionId, fixtures.employeeId), 409, 'inviting an employee with a pending shift');

    await updateShift(shiftId, { registration: 'REJECTED', timestamp: created.timestamp });
    await assertRejects(() => openShiftRegistration(fixtures.sessionId, fixtures.employeeId), 409, 'inviting an employee with a rejected shift');

    // A link sent before the manager staffed them by hand: resolve says registered, register refuses
    await deleteShift(shiftId);
    shiftId = null;
    const secondToken = extractToken(await openShiftRegistration(fixtures.sessionId, fixtures.employeeId));
    shiftId = extractId(await createShift({ sessionId: fixtures.sessionId, employeeId: fixtures.employeeId, role: 'waiter' }));

    const resolvedAgain = extractData(await resolveShiftRegistration(secondToken));
    assert.strictEqual(resolvedAgain.registered, true, 'resolve should report an already staffed employee as registered');
    assert.strictEqual(resolvedAgain.registeredRole, 'waiter', 'resolve should name the role they already hold');
    await assertRejects(() => registerShift(secondToken, { role: 'bartender' }), 409, 'registering twice for one event');

    // A refused registration must not burn the token - closing
    await revokeShiftRegistration(fixtures.sessionId);
    await assertRejects(() => resolveShiftRegistration(secondToken), 400, 'resolving after registration closed');
  } finally {
    if (shiftId) await deleteShift(shiftId);
    await deleteFixtures(fixtures);
  }
}

// Run entire shift registration lifecycle sequence
export async function runShiftRegistrationLifecycle() {
  console.log('=== Starting Shift Registration Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'admin') {
    await runAdminLifecycle();
  } else {
    await runForbiddenChecks(role);
  }

  console.log('=== Shift Registration Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runShiftRegistrationLifecycle();
}
