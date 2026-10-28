// Import external framework dependencies and status codes from third party packages
import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSession } from '../endpoints/session/create.js';
import { deleteSession } from '../endpoints/session/delete.js';
import { createMission } from '../endpoints/mission/create.js';
import { getMission } from '../endpoints/mission/get.js';
import { listMissions } from '../endpoints/mission/list.js';
import { updateMission } from '../endpoints/mission/update.js';
import { deleteMission } from '../endpoints/mission/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

function buildMissionPayload(sessionId) {
  return {
    sessionId: sessionId,
    name: "TEST",
    desc: "TEST DESCRIPTION"
  };
}

// Admin creates the client/session fixtures missions depend on
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

  return { clientId, sessionId };
}

// User must 403 on every mission op configuration setting for
async function runUserChecks() {
  console.log('Running mission 403 checks as user...');
  await assertForbidden(() => createMission(buildMissionPayload(fakeId())), 'mission create as user');
  await assertForbidden(() => getMission(fakeId()), 'mission get as user');
  await assertForbidden(() => listMissions({ sessionId: fakeId() }), 'mission list as user');
  await assertForbidden(() => updateMission(fakeId(), buildMissionPayload(fakeId())), 'mission update as user');
  await assertForbidden(() => deleteMission(fakeId()), 'mission delete as user');
  console.log('All mission 403 checks passed');
}

async function runManagerChecks() {
  console.log('Running mission manager checks...');
  await assertForbidden(() => createMission(buildMissionPayload(fakeId())), 'mission create as manager');
  await assertForbidden(() => updateMission(fakeId(), buildMissionPayload(fakeId())), 'mission update as manager');
  await assertForbidden(() => deleteMission(fakeId()), 'mission delete as manager');

  let fixtures;
  let missionId;
  await asAdmin(async () => {
    fixtures = await createFixtures();
    missionId = extractId(await createMission(buildMissionPayload(fixtures.sessionId)));
  });

  try {
    const mission = extractData(await getMission(missionId));
    assert.strictEqual(mission.id, missionId, 'mission get as manager should return the fixture');

    const missions = extractData(await listMissions({ sessionId: fixtures.sessionId }));
    assert.ok(Array.isArray(missions) && missions.some(m => m.id === missionId), 'mission list as manager should contain the fixture');
  } finally {
    await asAdmin(async () => {
      await deleteMission(missionId);
      await deleteSession(fixtures.sessionId);
      await deleteClient(fixtures.clientId);
    });
  }
  console.log('All mission manager checks passed');
}

async function runAdminLifecycle() {
  const fixtures = await createFixtures();

  const missionResponse = await createMission(buildMissionPayload(fixtures.sessionId));
  const missionId = extractId(missionResponse);

  const fetchedMission = await getMission(missionId);
  let missionTimestamp = new Date().toISOString();
  if (fetchedMission.data && fetchedMission.data.data && fetchedMission.data.data.timestamp) {
    missionTimestamp = fetchedMission.data.data.timestamp;
  }

  await listMissions({ sessionId: fixtures.sessionId });

  const updatePayload = {
    name: "UPDATE TEST",
    desc: "UPDATE TEST DESCRIPTION",
    status: "working",
    timestamp: missionTimestamp
  };
  await updateMission(missionId, updatePayload);

  await deleteMission(missionId);

  await deleteSession(fixtures.sessionId);

  await deleteClient(fixtures.clientId);
}

// Run entire mission lifecycle sequence configuration setting for module execution
export async function runMissionLifecycle() {
  console.log('=== Starting Mission Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else if (role === 'manager') {
    await runManagerChecks();
  } else {
    await runAdminLifecycle();
  }

  console.log('=== Mission Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runMissionLifecycle();
}
