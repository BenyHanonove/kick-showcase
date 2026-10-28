import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createClient } from '../endpoints/client/create.js';
import { getClient } from '../endpoints/client/get.js';
import { listClients } from '../endpoints/client/list.js';
import { updateClient } from '../endpoints/client/update.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

const CLIENT_PAYLOAD = {
  "name": "TEST",
  "brand": "TEST",
  "email": null,
  "phone": "0501234567"
};

// User must 403 on every client op
async function runUserChecks() {
  console.log('Running client 403 checks as user...');
  await assertForbidden(() => createClient(CLIENT_PAYLOAD), 'client create as user');
  await assertForbidden(() => getClient(fakeId()), 'client get as user');
  await assertForbidden(() => listClients([fakeId()]), 'client list as user');
  await assertForbidden(() => updateClient(fakeId(), CLIENT_PAYLOAD), 'client update as user');
  await assertForbidden(() => deleteClient(fakeId()), 'client delete as user');
  console.log('All client 403 checks passed');
}

async function runManagerChecks() {
  console.log('Running client manager checks...');
  await assertForbidden(() => createClient(CLIENT_PAYLOAD), 'client create as manager');
  await assertForbidden(() => updateClient(fakeId(), CLIENT_PAYLOAD), 'client update as manager');
  await assertForbidden(() => deleteClient(fakeId()), 'client delete as manager');

  let clientId;
  await asAdmin(async () => {
    clientId = extractId(await createClient(CLIENT_PAYLOAD));
  });

  try {
    const client = extractData(await getClient(clientId));
    assert.strictEqual(client.id, clientId, 'client get as manager should return the fixture');

    const clients = extractData(await listClients([clientId]));
    assert.ok(Array.isArray(clients) && clients.some(c => c.id === clientId), 'client list as manager should contain the fixture');
  } finally {
    await asAdmin(() => deleteClient(clientId));
  }
  console.log('All client manager checks passed');
}

async function runAdminLifecycle() {
  const createResponse = await createClient(CLIENT_PAYLOAD);
  const id = extractId(createResponse);

  const fetchedClient = await getClient(id);
  let clientTimestamp = new Date().toISOString();
  if (fetchedClient.data && fetchedClient.data.data && fetchedClient.data.data.timestamp) {
    clientTimestamp = fetchedClient.data.data.timestamp;
  }

  await listClients([id]);

  const updatePayload = {
    name: 'Updated TEST',
    brand: 'UPDATE TEST',
    phone: '0501234567',
    timestamp: clientTimestamp
  };
  await updateClient(id, updatePayload);

  await deleteClient(id);
}

// Run entire client lifecycle sequence
export async function runClientLifecycle() {
  console.log('=== Starting Client Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else if (role === 'manager') {
    await runManagerChecks();
  } else {
    await runAdminLifecycle();
  }

  console.log('=== Client Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runClientLifecycle();
}
