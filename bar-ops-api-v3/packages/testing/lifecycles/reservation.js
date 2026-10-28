// Import external framework dependencies and status codes from third party packages
import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createReservation } from '../endpoints/reservation/create.js';
import { getReservation } from '../endpoints/reservation/get.js';
import { listReservations } from '../endpoints/reservation/list.js';
import { updateReservation } from '../endpoints/reservation/update.js';
import { deleteReservation } from '../endpoints/reservation/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { generateUniquePhone, extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

function buildReservationPayload() {
  return {
    "fullName": "TEST",
    "phone": generateUniquePhone(),
    "eventType": "wedding",
    "eventDate": "2027-05-20",
    "guestCount": 150,
    "location": "TEST",
    "notes": "TEST"
  };
}

// User: 403 on every authenticated op, but the public form
async function runUserChecks() {
  console.log('Running reservation 403 checks as user...');
  await assertForbidden(() => getReservation(fakeId()), 'reservation get as user');
  await assertForbidden(() => listReservations(), 'reservation list as user');
  await assertForbidden(() => updateReservation(fakeId(), buildReservationPayload()), 'reservation update as user');
  await assertForbidden(() => deleteReservation(fakeId()), 'reservation delete as user');

  // Public create route must stay open regardless of role
  const reservationId = extractId(await createReservation(buildReservationPayload()));
  await asAdmin(() => deleteReservation(reservationId));
  console.log('All reservation user checks passed');
}

async function runManagerChecks() {
  console.log('Running reservation manager checks...');
  await assertForbidden(() => updateReservation(fakeId(), buildReservationPayload()), 'reservation update as manager');
  await assertForbidden(() => deleteReservation(fakeId()), 'reservation delete as manager');

  const reservationId = extractId(await createReservation(buildReservationPayload()));

  try {
    const reservation = extractData(await getReservation(reservationId));
    assert.strictEqual(reservation.id, reservationId, 'reservation get as manager should return the fixture');

    const reservations = extractData(await listReservations());
    assert.ok(Array.isArray(reservations) && reservations.some(r => r.id === reservationId), 'reservation list as manager should contain the fixture');
  } finally {
    await asAdmin(() => deleteReservation(reservationId));
  }
  console.log('All reservation manager checks passed');
}

async function runAdminLifecycle() {
  const id = extractId(await createReservation(buildReservationPayload()));

  const fetchedReservation = await getReservation(id);
  const reservation = extractData(fetchedReservation);
  assert.strictEqual(reservation.status, 'new', 'a fresh reservation should open in status new');

  let reservationTimestamp = new Date().toISOString();
  if (reservation && reservation.timestamp) {
    reservationTimestamp = reservation.timestamp;
  }

  await listReservations();

  const updatePayload = {
    fullName: 'Updated TEST',
    status: 'contacted',
    notes: 'UPDATE TEST',
    timestamp: reservationTimestamp
  };
  const updated = extractData(await updateReservation(id, updatePayload));
  assert.strictEqual(updated.status, 'contacted', 'reservation status should move to contacted');

  await deleteReservation(id);
}

// Run entire reservation lifecycle sequence configuration setting for module execution
export async function runReservationLifecycle() {
  console.log('=== Starting Reservation Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else if (role === 'manager') {
    await runManagerChecks();
  } else {
    await runAdminLifecycle();
  }

  console.log('=== Reservation Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runReservationLifecycle();
}
