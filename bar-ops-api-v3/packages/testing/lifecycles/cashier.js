import { fileURLToPath } from 'url';
import process from 'process';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSession } from '../endpoints/session/create.js';
import { deleteSession } from '../endpoints/session/delete.js';
import { createCashier } from '../endpoints/cashier/create.js';
import { getCashier } from '../endpoints/cashier/get.js';
import { listCashiers } from '../endpoints/cashier/list.js';
import { updateCashier } from '../endpoints/cashier/update.js';
import { deleteCashier } from '../endpoints/cashier/delete.js';
import { presignCashier } from '../endpoints/cashier/presign.js';
import { unsignCashier } from '../endpoints/cashier/unsign.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { extractId, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

async function createFixtures() {
  const clientResponse = await createClient({ name: 'BarOps Lounge', brand: 'BarOps Brand', email: null, phone: '0501234567' });
  const clientId = extractId(clientResponse);

  const sessionResponse = await createSession({
    clientId: clientId,
    datetime: '2026-06-01T10:00:00Z',
    name: 'Evening Shift',
    peopleAmount: 50,
    location: 'Main Hall',
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

// User must 403 on every cashier op
async function runUserChecks() {
  console.log('Running cashier 403 checks as user...');
  const payload = { sessionId: fakeId(), cash: 100, credit: 200, creditTip: 10, location: 'bar' };
  await assertForbidden(() => createCashier(payload), 'cashier create as user');
  await assertForbidden(() => getCashier(fakeId()), 'cashier get as user');
  await assertForbidden(() => listCashiers({ sessionId: fakeId() }), 'cashier list as user');
  await assertForbidden(() => updateCashier(fakeId(), payload), 'cashier update as user');
  await assertForbidden(() => deleteCashier(fakeId()), 'cashier delete as user');
  await assertForbidden(() => presignCashier({ file: 'eA==', filename: 'z.csv', sessionId: fakeId(), location: 'bar' }), 'cashier presign as user');
  await assertForbidden(() => unsignCashier({ id: fakeId() }), 'cashier unsign as user');
  console.log('All cashier 403 checks passed');
}

// Full cashier flow for a role; fixtures are admin-only
async function runCashierFlow() {
  const fixtures = await asAdmin(createFixtures);

  try {
    const cashierPayload = {
      sessionId: fixtures.sessionId,
      cash: 100,
      credit: 200,
      creditTip: 10,
      location: 'bar'
    };
    const cashierResponse = await createCashier(cashierPayload);
    const cashierId = extractId(cashierResponse);

    const fetchedCashier = await getCashier(cashierId);
    let cashierTimestamp = new Date().toISOString();
    if (fetchedCashier.data && fetchedCashier.data.data && fetchedCashier.data.data.timestamp) {
      cashierTimestamp = fetchedCashier.data.data.timestamp;
    }

    await listCashiers({ sessionId: fixtures.sessionId });

    const updatePayload = {
      sessionId: fixtures.sessionId,
      cash: 150,
      credit: 250,
      creditTip: 10,
      location: 'bar',
      timestamp: cashierTimestamp
    };
    await updateCashier(cashierId, updatePayload);

    // Presign Z-report CSV (creates a second cashier)
    const zNumber = Date.now();
    const csvContent = [
      'מזומן,100',
      'ויזה,50',
      'מסטרקארד,0',
      'אמקס,0',
      'טיפ,10',
      'קוד קופה,1',
      'קוד חנות,7',
      `מספר Z,${zNumber}`
    ].join('\n');

    const presignPayload = {
      file: Buffer.from(csvContent, 'utf-8').toString('base64'),
      filename: 'z-report.csv',
      sessionId: fixtures.sessionId,
      location: 'bar'
    };

    const presignResponse = await presignCashier(presignPayload);
    const zCashierId = extractId(presignResponse);

    await unsignCashier({ id: zCashierId });

    await deleteCashier(zCashierId);

    await deleteCashier(cashierId);
  } finally {
    await asAdmin(() => deleteFixtures(fixtures));
  }
}

// Run entire cashier lifecycle sequence
export async function runCashierLifecycle() {
  console.log('=== Starting Cashier Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else {
    // Cashier is fully admin+manager: same flow for both roles
    await runCashierFlow();
  }

  console.log('=== Cashier Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCashierLifecycle();
}
