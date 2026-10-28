import assert from 'assert';
import { createClient } from '../../endpoints/client/create.js';
import { deleteClient } from '../../endpoints/client/delete.js';
import { createSession } from '../../endpoints/session/create.js';
import { deleteSession } from '../../endpoints/session/delete.js';
import { listTips } from '../../endpoints/tips/list.js';
import { getTips } from '../../endpoints/tips/get.js';
import { deleteTips } from '../../endpoints/tips/delete.js';
import { createCashier } from '../../endpoints/cashier/create.js';
import { getCashier } from '../../endpoints/cashier/get.js';
import { updateCashier } from '../../endpoints/cashier/update.js';
import { deleteCashier } from '../../endpoints/cashier/delete.js';
import { selectUserRoleAndLogin } from '../../shared/select-role.js';

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

// Run the sync propagation test
export async function runSyncTest() {
  await selectUserRoleAndLogin();
  console.log('=== Starting Cashier Tips Sync Verification ===');

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

  // Fetch existing Tips records seeded by the Session Observer (with polling)
  console.log('Fetching seeded Tips records for session (with polling)...');
  let barTips;
  await assertWithRetry(async () => {
    const tipsListResponse = await listTips({ sessionId: sessionId });
    const tipsList = tipsListResponse.data?.data || [];
    barTips = tipsList.find(t => t.area === 'bar');
    assert.ok(barTips, `Seeded Tips record for area 'bar' not found in session ${sessionId}`);
  });
  const tipsId = barTips.id;
  console.log(`Found seeded Bar Tips ID: ${tipsId}`);

  assert.strictEqual(barTips.creditTip, 0, 'Initial tips creditTip must be 0');

  const cashierPayload = {
    sessionId: sessionId,
    cash: 100,
    credit: 200,
    creditTip: 10,
    location: 'bar'
  };
  const cashierResponse = await createCashier(cashierPayload);
  const cashierId = extractId(cashierResponse);

  // Fetch updated cashier to get the timestamp for potential updates
  const fetchedCashier = await getCashier(cashierId);
  let cashierTimestamp = fetchedCashier.data?.data?.timestamp || new Date().toISOString();

  console.log('Asserting Tips creditTip is updated to 10 (with polling)...');
  await assertWithRetry(async () => {
    const fetchedTips = await getTips(tipsId);
    assert.strictEqual(fetchedTips.data?.data?.creditTip, 10, 'Tips creditTip should sync to 10 after cashier creation');
  });

  // Update Cashier (change creditTip to 25 to check modify sync)
  const updatePayload = {
    sessionId: sessionId,
    cash: 150,
    credit: 250,
    creditTip: 25,
    location: 'bar',
    timestamp: cashierTimestamp
  };
  await updateCashier(cashierId, updatePayload);
  
  console.log('Asserting Tips creditTip is updated to 25 (with polling)...');
  await assertWithRetry(async () => {
    const fetchedTips = await getTips(tipsId);
    assert.strictEqual(fetchedTips.data?.data?.creditTip, 25, 'Tips creditTip should sync to 25 after cashier update');
  });

  await deleteCashier(cashierId);

  // Assert Tips creditTip is back to 0
  console.log('Asserting Tips creditTip is updated back to 0 (with polling)...');
  await assertWithRetry(async () => {
    const fetchedTips = await getTips(tipsId);
    assert.strictEqual(fetchedTips.data?.data?.creditTip, 0, 'Tips creditTip should sync back to 0 after cashier deletion');
  });

  await deleteTips(tipsId);
  await deleteSession(sessionId);
  await deleteClient(clientId);

  console.log('=== Cashier Tips Sync Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runSyncTest();
}
