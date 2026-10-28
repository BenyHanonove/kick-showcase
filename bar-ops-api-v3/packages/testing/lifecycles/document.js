import { fileURLToPath } from 'url';
import process from 'process';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSession } from '../endpoints/session/create.js';
import { deleteSession } from '../endpoints/session/delete.js';
import { createDocument } from '../endpoints/document/create.js';
import { listDocuments } from '../endpoints/document/list.js';
import { getDocument } from '../endpoints/document/get.js';
import { updateDocument } from '../endpoints/document/update.js';
import { deleteDocument } from '../endpoints/document/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole } from '../shared/auth-guard.js';
import { extractId, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

async function runForbiddenChecks(role) {
  console.log(`Running document 403 checks as ${role}...`);
  const payload = {
    sessionId: fakeId(),
    name: 'test.txt',
    contentType: 'text/plain',
    file: 'VEVTVA==',
    desc: 'TEST'
  };
  await assertForbidden(() => createDocument(payload), `document create as ${role}`);
  await assertForbidden(() => listDocuments({ sessionId: fakeId() }), `document list as ${role}`);
  await assertForbidden(() => getDocument(fakeId()), `document get as ${role}`);
  await assertForbidden(() => updateDocument(fakeId(), { desc: 'TEST', timestamp: new Date().toISOString() }), `document update as ${role}`);
  await assertForbidden(() => deleteDocument(fakeId()), `document delete as ${role}`);
  console.log('All document 403 checks passed');
}

// Admin creates the client/session fixtures documents depend on
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

async function deleteFixtures({ clientId, sessionId }) {
  await deleteSession(sessionId);
  await deleteClient(clientId);
}

async function runAdminLifecycle() {
  const fixtures = await createFixtures();

  const documentPayload = {
    sessionId: fixtures.sessionId,
    name: 'test.txt',
    contentType: 'text/plain',
    file: 'VEVTVA==',
    desc: 'TEST'
  };
  const documentResponse = await createDocument(documentPayload);
  const documentId = extractId(documentResponse);

  await listDocuments({ sessionId: fixtures.sessionId });

  const fetchedDocument = await getDocument(documentId);
  let documentTimestamp = new Date().toISOString();
  if (fetchedDocument.data && fetchedDocument.data.data && fetchedDocument.data.data.timestamp) {
    documentTimestamp = fetchedDocument.data.data.timestamp;
  }

  // Update document — rename and change description
  await updateDocument(documentId, {
    name: 'renamed-test.txt',
    desc: 'UPDATE TEST',
    timestamp: documentTimestamp
  });

  await deleteDocument(documentId);

  await deleteFixtures(fixtures);
}

// Run entire document lifecycle sequence
export async function runDocumentLifecycle() {
  console.log('=== Starting Document Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'admin') {
    await runAdminLifecycle();
  } else {
    await runForbiddenChecks(role);
  }

  console.log('=== Document Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runDocumentLifecycle();
}
