import { fileURLToPath } from 'url';
import process from 'process';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSession } from '../endpoints/session/create.js';
import { deleteSession } from '../endpoints/session/delete.js';
import { createVehicle } from '../endpoints/vehicle/create.js';
import { getVehicle } from '../endpoints/vehicle/get.js';
import { listVehicles } from '../endpoints/vehicle/list.js';
import { updateVehicle } from '../endpoints/vehicle/update.js';
import { deleteVehicle } from '../endpoints/vehicle/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { extractId, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

async function createFixtures() {
  const clientResponse = await createClient({ name: 'TEST', brand: 'TEST', email: null, phone: '0501234567' });
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

async function deleteFixtures({ clientId, sessionId }) {
  await deleteSession(sessionId);
  await deleteClient(clientId);
}

// User must 403 on every vehicle op
async function runUserChecks() {
  console.log('Running vehicle 403 checks as user...');
  const payload = { sessionId: fakeId(), sum: 100, desc: 'TEST VEHICLE', licensePlate: '11-222-33' };
  await assertForbidden(() => createVehicle(payload), 'vehicle create as user');
  await assertForbidden(() => getVehicle(fakeId()), 'vehicle get as user');
  await assertForbidden(() => listVehicles({ sessionId: fakeId() }), 'vehicle list as user');
  await assertForbidden(() => updateVehicle(fakeId(), payload), 'vehicle update as user');
  await assertForbidden(() => deleteVehicle(fakeId()), 'vehicle delete as user');
  console.log('All vehicle 403 checks passed');
}

// Full vehicle flow for a role; fixtures are admin-only
async function runVehicleFlow() {
  const fixtures = await asAdmin(createFixtures);

  try {
    const vehiclePayload = {
      sessionId: fixtures.sessionId,
      sum: 100,
      desc: "TEST VEHICLE",
      licensePlate: "11-222-33"
    };
    const vehicleResponse = await createVehicle(vehiclePayload);
    const vehicleId = extractId(vehicleResponse);

    const fetchedVehicle = await getVehicle(vehicleId);
    let vehicleTimestamp = new Date().toISOString();
    if (fetchedVehicle.data && fetchedVehicle.data.data && fetchedVehicle.data.data.timestamp) {
      vehicleTimestamp = fetchedVehicle.data.data.timestamp;
    }

    await listVehicles({ sessionId: fixtures.sessionId });

    const updatePayload = {
      sum: 150,
      desc: "UPDATE TEST VEHICLE",
      licensePlate: "44-555-66",
      timestamp: vehicleTimestamp
    };
    await updateVehicle(vehicleId, updatePayload);

    await deleteVehicle(vehicleId);
  } finally {
    await asAdmin(() => deleteFixtures(fixtures));
  }
}

// Run entire vehicle lifecycle sequence
export async function runVehicleLifecycle() {
  console.log('=== Starting Vehicle Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else {
    // Vehicle is fully admin+manager: same flow for both roles
    await runVehicleFlow();
  }

  console.log('=== Vehicle Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runVehicleLifecycle();
}
