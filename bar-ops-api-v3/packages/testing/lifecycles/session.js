import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSession } from '../endpoints/session/create.js';
import { getSession } from '../endpoints/session/get.js';
import { listSessions } from '../endpoints/session/list.js';
import { updateSession } from '../endpoints/session/update.js';
import { deleteSession } from '../endpoints/session/delete.js';
import { getSessionSummary } from '../endpoints/session/summary.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden, assertNotFound } from '../shared/role-assert.js';

function buildSessionPayload(clientId) {
  return {
    "clientId": clientId,
    "datetime": "2026-06-01T10:00:00Z",
    "name": "TEST",
    "peopleAmount": 50,
    "location": "TEST",
    "processingFee": 2,
    "type": "hardstyle"
  };
}

// User must 403 on every session op
async function runUserChecks() {
  console.log('Running session 403 checks as user...');
  await assertForbidden(() => createSession(buildSessionPayload(fakeId())), 'session create as user');
  await assertForbidden(() => getSession(fakeId()), 'session get as user');
  await assertForbidden(() => listSessions({ clientId: fakeId(), monthYear: '2026-06' }), 'session list as user');
  await assertForbidden(() => listSessions({ startDate: '2026-06-01', endDate: '2026-06-30' }), 'session list by date range as user');
  await assertForbidden(() => updateSession(fakeId(), buildSessionPayload(fakeId())), 'session update as user');
  await assertForbidden(() => deleteSession(fakeId()), 'session delete as user');
  await assertForbidden(() => getSessionSummary(fakeId()), 'session summary as user');
  console.log('All session 403 checks passed');
}

// Manager: writes forbidden, reads only see active sessions
async function runManagerChecks() {
  console.log('Running session manager checks...');
  await assertForbidden(() => createSession(buildSessionPayload(fakeId())), 'session create as manager');
  await assertForbidden(() => updateSession(fakeId(), buildSessionPayload(fakeId())), 'session update as manager');
  await assertForbidden(() => deleteSession(fakeId()), 'session delete as manager');
  await assertForbidden(() => getSessionSummary(fakeId()), 'session summary as manager');

  // Admin creates client + session (status defaults to active)
  let clientId;
  let sessionId;
  let sessionTimestamp;
  await asAdmin(async () => {
    const clientResponse = await createClient({ name: 'TEST', brand: 'TEST', email: null, phone: '0501234567' });
    clientId = extractId(clientResponse);
    const sessionResponse = await createSession(buildSessionPayload(clientId));
    sessionId = extractId(sessionResponse);
    const created = extractData(sessionResponse);
    sessionTimestamp = created && created.timestamp ? created.timestamp : new Date().toISOString();
  });

  try {
    const session = extractData(await getSession(sessionId));
    assert.strictEqual(session.id, sessionId, 'session get as manager should return the active session');

    const sessions = extractData(await listSessions({ clientId: clientId, monthYear: '2026-06' }));
    assert.ok(Array.isArray(sessions) && sessions.some(s => s.id === sessionId), 'session list as manager should contain the active session');

    // Same lookup by client only (no monthYear/date range) must still find it
    const sessionsByClientOnly = extractData(await listSessions({ clientId: clientId }));
    assert.ok(Array.isArray(sessionsByClientOnly) && sessionsByClientOnly.some(s => s.id === sessionId), 'session list by client only as manager should contain the active session');

    // Date-range lookup (day-precision) must find it inside its day and exclude it outside
    const sessionsInRange = extractData(await listSessions({ clientId: clientId, startDate: '2026-06-01', endDate: '2026-06-01' }));
    assert.ok(Array.isArray(sessionsInRange) && sessionsInRange.some(s => s.id === sessionId), 'session list by date range as manager should contain the session on its exact day');

    const sessionsOutOfRange = extractData(await listSessions({ clientId: clientId, startDate: '2026-06-02', endDate: '2026-06-30' }));
    assert.ok(!Array.isArray(sessionsOutOfRange) || !sessionsOutOfRange.some(s => s.id === sessionId), 'session list by date range as manager should exclude the session outside its day');

    // Admin closes the session; manager must no longer see it
    await asAdmin(async () => {
      const updatePayload = { ...buildSessionPayload(clientId), status: 'close', timestamp: sessionTimestamp };
      delete updatePayload.processingFee;
      await updateSession(sessionId, updatePayload);
    });

    await assertNotFound(() => getSession(sessionId), 'session get as manager after close');
    const sessionsAfterClose = extractData(await listSessions({ clientId: clientId, monthYear: '2026-06' }));
    assert.ok(!Array.isArray(sessionsAfterClose) || !sessionsAfterClose.some(s => s.id === sessionId), 'session list as manager should not contain the closed session');
  } finally {
    await asAdmin(async () => {
      await deleteSession(sessionId);
      await deleteClient(clientId);
    });
  }
  console.log('All session manager checks passed');
}

async function runAdminLifecycle() {
  const clientPayload = {
    "name": "TEST",
    "brand": "TEST",
    "email": null,
    "phone": "0501234567"
  };
  const clientResponse = await createClient(clientPayload);
  const clientId = extractId(clientResponse);

  const sessionResponse = await createSession(buildSessionPayload(clientId));
  const sessionId = extractId(sessionResponse);

  const fetchedSession = await getSession(sessionId);
  let sessionTimestamp = new Date().toISOString();
  if (fetchedSession.data && fetchedSession.data.data && fetchedSession.data.data.timestamp) {
    sessionTimestamp = fetchedSession.data.data.timestamp;
  }

  // List sessions by clientId + monthYear (existing exact-month path)
  await listSessions({ clientId: clientId, monthYear: '2026-06' });

  // List sessions by clientId only (no monthYear/date range)
  const byClientOnly = extractData(await listSessions({ clientId: clientId }));
  assert.ok(Array.isArray(byClientOnly) && byClientOnly.some(s => s.id === sessionId), 'session list by client only should contain the session');

  // Date-range: day-precision within the session's own month
  const inRange = extractData(await listSessions({ clientId: clientId, startDate: '2026-06-01', endDate: '2026-06-01' }));
  assert.ok(Array.isArray(inRange) && inRange.some(s => s.id === sessionId), 'session list by date range should contain the session on its exact day');

  const outOfRange = extractData(await listSessions({ clientId: clientId, startDate: '2026-06-02', endDate: '2026-06-30' }));
  assert.ok(!Array.isArray(outOfRange) || !outOfRange.some(s => s.id === sessionId), 'session list by date range should exclude the session outside its day');

  // Date-range spanning multiple months, no clientId (exercises the per-month Query loop)
  const crossMonth = extractData(await listSessions({ startDate: '2026-05-15', endDate: '2026-07-15' }));
  assert.ok(Array.isArray(crossMonth) && crossMonth.some(s => s.id === sessionId), 'session list by cross-month date range should contain the session');

  const updatePayload = {
    "clientId": clientId,
    "datetime": "2026-06-01T10:00:00Z",
    "name": "TEST",
    "peopleAmount": 75,
    "location": "TEST",
    "type": "hardstyle",
    "status": "active",
    "timestamp": sessionTimestamp
  };
  await updateSession(sessionId, updatePayload);

  await deleteSession(sessionId);

  await deleteClient(clientId);
}

// Run entire session lifecycle sequence
export async function runSessionLifecycle() {
  console.log('=== Starting Session Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else if (role === 'manager') {
    await runManagerChecks();
  } else {
    await runAdminLifecycle();
  }

  console.log('=== Session Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runSessionLifecycle();
}
