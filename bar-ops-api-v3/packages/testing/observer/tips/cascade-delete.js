// Import external framework dependencies and status codes from third party packages
import assert from 'assert';
import { createClient } from '../../endpoints/client/create.js';
import { deleteClient } from '../../endpoints/client/delete.js';
import { createSession } from '../../endpoints/session/create.js';
import { getSession } from '../../endpoints/session/get.js';
import { listTips } from '../../endpoints/tips/list.js';
import { getTips } from '../../endpoints/tips/get.js';
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

// Poll and retry assertion for async processes configuration setting for
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

// Assert entity returns 404 after cascade deletion (with polling)
async function assertCascadeDeleted(name, fetchFn) {
  console.log(`Verifying ${name} is cascade-deleted (with polling)...`);
  await assertWithRetry(async () => {
    let deleted = false;
    try {
      await fetchFn();
    } catch (error) {
      if (error.status === 404) {
        deleted = true;
      } else {
        throw error;
      }
    }
    assert.ok(deleted, `${name} should have been cascade-deleted after client deletion`);
  });
}

// Run the tips seeding + cascade delete test
export async function runCascadeDeleteTest() {
  await selectUserRoleAndLogin();
  console.log('=== Starting Tips Cascade Delete Verification ===');

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

  // Verify the observer seeded exactly two tips: one 'bar', one
  console.log('Verifying two Tips instances were seeded for the session (with polling)...');
  let barTips;
  let tablesTips;
  await assertWithRetry(async () => {
    const tipsListResponse = await listTips({ sessionId: sessionId });
    const tipsList = tipsListResponse.data?.data || [];
    assert.strictEqual(tipsList.length, 2, `Expected exactly 2 seeded Tips records, got ${tipsList.length}`);
    barTips = tipsList.find(t => t.area === 'bar');
    tablesTips = tipsList.find(t => t.area === 'tables');
    assert.ok(barTips, `Seeded Tips record for area 'bar' not found in session ${sessionId}`);
    assert.ok(tablesTips, `Seeded Tips record for area 'tables' not found in session ${sessionId}`);
  });
  console.log(`Found seeded Tips - bar: ${barTips.id}, tables: ${tablesTips.id}`);

  // Verify session can be fetched before deletion configuration setting for
  await getSession(sessionId);

  console.log(`Deleting Client: ${clientId}...`);
  await deleteClient(clientId);

  // Verify the cascade chain: client -> session -> both tips
  await assertCascadeDeleted('Session', () => getSession(sessionId));
  await assertCascadeDeleted('Bar Tips', () => getTips(barTips.id));
  await assertCascadeDeleted('Tables Tips', () => getTips(tablesTips.id));

  console.log('=== Tips Cascade Delete Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCascadeDeleteTest();
}
