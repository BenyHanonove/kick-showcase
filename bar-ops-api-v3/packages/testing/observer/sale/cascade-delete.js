import assert from 'assert';
import { createClient } from '../../endpoints/client/create.js';
import { deleteClient } from '../../endpoints/client/delete.js';
import { createSale } from '../../endpoints/sale/create.js';
import { getSale } from '../../endpoints/sale/get.js';
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

// Run the cascade delete test
export async function runCascadeDeleteTest() {
  await selectUserRoleAndLogin();
  console.log('=== Starting Sale Cascade Delete Verification ===');

  const clientPayload = {
    "name": "Cascade Test Lounge",
    "brand": "Cascade Test Brand",
    "email": null,
    "phone": "0501234567"
  };
  const clientResponse = await createClient(clientPayload);
  const clientId = extractId(clientResponse);

  const salePayload = {
    clientId: clientId,
    datetime: "2026-06-01T10:00:00Z",
    name: "Cascade Test Sale"
  };
  const saleResponse = await createSale(salePayload);
  const saleId = extractId(saleResponse);

  // Verify sale can be fetched before deletion
  await getSale(saleId);

  console.log(`Deleting Client: ${clientId}...`);
  await deleteClient(clientId);

  await assertCascadeDeleted('Sale', () => getSale(saleId));

  console.log('=== Sale Cascade Delete Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCascadeDeleteTest();
}
