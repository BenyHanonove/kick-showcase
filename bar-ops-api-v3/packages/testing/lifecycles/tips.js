// Import external framework dependencies and status codes from third party packages
import { fileURLToPath } from 'url';
import process from 'process';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSession } from '../endpoints/session/create.js';
import { deleteSession } from '../endpoints/session/delete.js';
import { createTips } from '../endpoints/tips/create.js';
import { getTips } from '../endpoints/tips/get.js';
import { listTips } from '../endpoints/tips/list.js';
import { updateTips } from '../endpoints/tips/update.js';
import { deleteTips } from '../endpoints/tips/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole } from '../shared/auth-guard.js';
import { extractId, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

async function runForbiddenChecks(role) {
  console.log(`Running tips 403 checks as ${role}...`);
  const payload = { sessionId: fakeId(), creditTip: 40, cashTip: 100, area: 'bar', totalHours: 8, runnerFeed: 10 };
  await assertForbidden(() => createTips(payload), `tips create as ${role}`);
  await assertForbidden(() => getTips(fakeId()), `tips get as ${role}`);
  await assertForbidden(() => listTips({ sessionId: fakeId() }), `tips list as ${role}`);
  await assertForbidden(() => updateTips(fakeId(), payload), `tips update as ${role}`);
  await assertForbidden(() => deleteTips(fakeId()), `tips delete as ${role}`);
  console.log('All tips 403 checks passed');
}

async function runAdminLifecycle() {
  const clientPayload = {
    "name": "TEST",
    "brand": "TEST",
    "email": null,
    "phone": "0507799799"
  };
  const clientResponse = await createClient(clientPayload);
  const clientId = extractId(clientResponse);

  const sessionPayload = {
    "clientId": clientId,
    "datetime": "2026-06-01T10:00:00Z",
    "name": "TEST",
    "peopleAmount": 50,
    "location": "TEST",
    "processingFee": 2,
    "type": "hardstyle"
  };
  const sessionResponse = await createSession(sessionPayload);
  const sessionId = extractId(sessionResponse);

  const tipsPayload = {
    "sessionId": sessionId,
    "creditTip": 40,
    "cashTip": 100,
    "area": "bar",
    "totalHours": 8,
    "runnerFeed": 10
  };
  const tipsResponse = await createTips(tipsPayload);
  const tipsId = extractId(tipsResponse);

  const fetchedTips = await getTips(tipsId);
  let tipsTimestamp = new Date().toISOString();
  if (fetchedTips.data && fetchedTips.data.data && fetchedTips.data.data.timestamp) {
    tipsTimestamp = fetchedTips.data.data.timestamp;
  }

  await listTips({ sessionId: sessionId });

  const updatePayload = {
    "creditTip": 40,
    "cashTip": 50,
    "area": "bar",
    "totalHours": 8,
    "runnerFeed": 15,
    "timestamp": tipsTimestamp
  };
  await updateTips(tipsId, updatePayload);

  await deleteTips(tipsId);

  await deleteSession(sessionId);

  await deleteClient(clientId);
}

// Run entire tips lifecycle sequence configuration setting for module execution
export async function runTipsLifecycle() {
  console.log('=== Starting Tips Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'admin') {
    await runAdminLifecycle();
  } else {
    await runForbiddenChecks(role);
  }

  console.log('=== Tips Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runTipsLifecycle();
}
