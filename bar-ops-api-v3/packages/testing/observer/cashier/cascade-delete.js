import assert from 'assert';
import { createClient } from '../../endpoints/client/create.js';
import { deleteClient } from '../../endpoints/client/delete.js';
import { createSession } from '../../endpoints/session/create.js';
import { deleteSession } from '../../endpoints/session/delete.js';
import { createCashier } from '../../endpoints/cashier/create.js';
import { getCashier } from '../../endpoints/cashier/get.js';
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

// Poll and retry assertion for async processes
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

// Run the cascade delete test
export async function runCascadeDeleteTest() {
  await selectUserRoleAndLogin();
  console.log('=== Starting Cashier Cascade Delete Verification ===');

  const clientPayload = {
    "name": "Cascade Test Lounge",
    "brand": "Cascade Test Brand",
    "email": null,
    "phone": "0507799799"
  };
  const clientResponse = await createClient(clientPayload);
  const clientId = extractId(clientResponse);

  const sessionPayload = {
    "clientId": clientId,
    "datetime": "2026-06-01T10:00:00Z",
    "name": "Cascade Test Shift",
    "peopleAmount": 50,
    "location": "Main Hall",
    "processingFee": 2,
    "type": "hardstyle"
  };
  const sessionResponse = await createSession(sessionPayload);
  const sessionId = extractId(sessionResponse);

  const cashier1Payload = {
    sessionId: sessionId,
    cash: 100,
    credit: 200,
    creditTip: 10,
    location: 'bar'
  };
  const cashier1Response = await createCashier(cashier1Payload);
  const cashier1Id = extractId(cashier1Response);

  const cashier2Payload = {
    sessionId: sessionId,
    cash: 150,
    credit: 250,
    creditTip: 20,
    location: 'tables'
  };
  const cashier2Response = await createCashier(cashier2Payload);
  const cashier2Id = extractId(cashier2Response);

  // Verify both cashiers can be fetched before deletion
  await getCashier(cashier1Id);
  await getCashier(cashier2Id);

  console.log(`Deleting Session: ${sessionId}...`);
  await deleteSession(sessionId);

  // Verify Cashier 1 is deleted (with polling)
  console.log('Verifying Cashier 1 is cascade-deleted (with polling)...');
  await assertWithRetry(async () => {
    let cashier1Deleted = false;
    try {
      await getCashier(cashier1Id);
    } catch (error) {
      if (error.status === 404) {
        cashier1Deleted = true;
      } else {
        throw error;
      }
    }
    assert.ok(cashier1Deleted, 'Cashier 1 should have been cascade-deleted after session deletion');
  });

  // Verify Cashier 2 is deleted (with polling)
  console.log('Verifying Cashier 2 is cascade-deleted (with polling)...');
  await assertWithRetry(async () => {
    let cashier2Deleted = false;
    try {
      await getCashier(cashier2Id);
    } catch (error) {
      if (error.status === 404) {
        cashier2Deleted = true;
      } else {
        throw error;
      }
    }
    assert.ok(cashier2Deleted, 'Cashier 2 should have been cascade-deleted after session deletion');
  });

  await deleteClient(clientId);

  console.log('=== Cashier Cascade Delete Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCascadeDeleteTest();
}
