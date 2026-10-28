import assert from 'assert';
import { createClient } from '../../endpoints/client/create.js';
import { deleteClient } from '../../endpoints/client/delete.js';
import { createSession } from '../../endpoints/session/create.js';
import { getSession } from '../../endpoints/session/get.js';
import { createDocument } from '../../endpoints/document/create.js';
import { getDocument } from '../../endpoints/document/get.js';
import { selectUserRoleAndLogin } from '../../shared/select-role.js';
import { extractId } from '../../shared/utils.js';

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
  console.log('=== Starting Document Cascade Delete Verification ===');

  const clientResponse = await createClient({
    name: 'Cascade Test Lounge',
    brand: 'Cascade Test Brand',
    email: null,
    phone: '0501234567'
  });
  const clientId = extractId(clientResponse);

  const sessionResponse = await createSession({
    clientId: clientId,
    datetime: '2026-06-01T10:00:00Z',
    name: 'Cascade Test Shift',
    peopleAmount: 50,
    location: 'Main Hall',
    processingFee: 2,
    type: 'hardstyle'
  });
  const sessionId = extractId(sessionResponse);

  const documentResponse = await createDocument({
    sessionId: sessionId,
    name: 'cascade-test.txt',
    contentType: 'text/plain',
    file: 'VEVTVA==',
    desc: 'Cascade Test Desc'
  });
  const documentId = extractId(documentResponse);

  // Verify session and document can be fetched before deletion
  await getSession(sessionId);
  await getDocument(documentId);

  console.log(`Deleting Client: ${clientId}...`);
  await deleteClient(clientId);

  await assertCascadeDeleted('Session', () => getSession(sessionId));

  await assertCascadeDeleted('Document', () => getDocument(documentId));

  console.log('=== Document Cascade Delete Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCascadeDeleteTest();
}
