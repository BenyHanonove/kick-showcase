import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSession } from '../endpoints/session/create.js';
import { deleteSession } from '../endpoints/session/delete.js';
import { createSupplier } from '../endpoints/supplier/create.js';
import { deleteSupplier } from '../endpoints/supplier/delete.js';
import { createProduct } from '../endpoints/product/create.js';
import { deleteProduct } from '../endpoints/product/delete.js';
import { createConsume } from '../endpoints/consume/create.js';
import { getConsume } from '../endpoints/consume/get.js';
import { listConsume } from '../endpoints/consume/list.js';
import { updateConsume } from '../endpoints/consume/update.js';
import { deleteConsume } from '../endpoints/consume/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden, assertFieldsDropped } from '../shared/role-assert.js';
import { managerDrops } from '../shared/role-matrix.js';

const CONSUME_DROPS = managerDrops('consume');

// Build consume payload for a session/product pair
function buildConsumePayload(sessionId, productId) {
  return {
    sessionId: sessionId,
    productId: productId,
    chargedPrice: 15,
    supplierPrice: 5,
    target: 2,
    order: 1,
    arrived: 1,
    fromStorage: 1,
    creditedToSupplier: 0,
    returnedToStorage: 0
  };
}

// Admin creates the client/session/supplier/product fixtures consumes depend on
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

  const supplierResponse = await createSupplier({ name: 'TEST', phone: '123456789', contactName: 'TEST', address: 'TEST', notes: 'TEST' });
  const supplierId = extractId(supplierResponse);

  const productResponse = await createProduct({
    supplierId: supplierId,
    name: 'Beer Bottle',
    price: 5,
    volume: 330,
    type: 'alcohol',
    quantity: 24,
    isBase: true
  });
  const productId = extractId(productResponse);

  return { clientId, sessionId, supplierId, productId };
}

async function deleteFixtures({ clientId, sessionId, supplierId, productId }) {
  await deleteSession(sessionId);
  await deleteClient(clientId);
  await deleteProduct(productId);
  await deleteSupplier(supplierId);
}

// User must 403 on every consume op
async function runUserChecks() {
  console.log('Running consume 403 checks as user...');
  const payload = buildConsumePayload(fakeId(), fakeId());
  await assertForbidden(() => createConsume(payload), 'consume create as user');
  await assertForbidden(() => getConsume(fakeId()), 'consume get as user');
  await assertForbidden(() => listConsume({ sessionId: fakeId() }), 'consume list as user');
  await assertForbidden(() => updateConsume(fakeId(), payload), 'consume update as user');
  await assertForbidden(() => deleteConsume(fakeId()), 'consume delete as user');
  console.log('All consume 403 checks passed');
}

// Manager: full lifecycle with chargedPrice dropped and update-strip verified
async function runManagerChecks() {
  console.log('Running consume manager checks...');
  const fixtures = await asAdmin(createFixtures);
  let consumeId = null;

  try {
    // Manager create: chargedPrice is stored but dropped from the response
    const consumeResponse = await createConsume(buildConsumePayload(fixtures.sessionId, fixtures.productId));
    consumeId = extractId(consumeResponse);
    assertFieldsDropped(extractData(consumeResponse), CONSUME_DROPS, 'consume create as manager');

    const fetchedConsume = extractData(await getConsume(consumeId));
    assertFieldsDropped(fetchedConsume, CONSUME_DROPS, 'consume get as manager');
    const consumeTimestamp = fetchedConsume.timestamp;

    const consumes = extractData(await listConsume({ sessionId: fixtures.sessionId }));
    assert.ok(Array.isArray(consumes) && consumes.some(c => c.id === consumeId), 'consume list as manager should contain the consume');
    for (const c of consumes) {
      assertFieldsDropped(c, CONSUME_DROPS, 'consume list row as manager');
    }

    // Manager update sends chargedPrice; the server must strip it
    const updateResponse = await updateConsume(consumeId, {
      chargedPrice: 999,
      target: 2,
      order: 1,
      arrived: 2,
      fromStorage: 1,
      timestamp: consumeTimestamp
    });
    assertFieldsDropped(extractData(updateResponse), CONSUME_DROPS, 'consume update response as manager');

    // Admin read-back: chargedPrice unchanged, other fields updated
    await asAdmin(async () => {
      const adminView = extractData(await getConsume(consumeId));
      assert.strictEqual(adminView.chargedPrice, 15, 'chargedPrice should be unchanged after manager update');
      assert.strictEqual(adminView.arrived, 2, 'arrived should be updated by manager update');
    });

    await deleteConsume(consumeId);
    consumeId = null;
  } finally {
    await asAdmin(async () => {
      if (consumeId) await deleteConsume(consumeId);
      await deleteFixtures(fixtures);
    });
  }
  console.log('All consume manager checks passed');
}

async function runAdminLifecycle() {
  const fixtures = await createFixtures();

  const consumeResponse = await createConsume(buildConsumePayload(fixtures.sessionId, fixtures.productId));
  const consumeId = extractId(consumeResponse);

  const fetchedConsume = await getConsume(consumeId);
  let consumeTimestamp = new Date().toISOString();
  if (fetchedConsume.data && fetchedConsume.data.data && fetchedConsume.data.data.timestamp) {
    consumeTimestamp = fetchedConsume.data.data.timestamp;
  }

  await listConsume({ sessionId: fixtures.sessionId });

  const updatePayload = {
    chargedPrice: 20,
    target: 2,
    order: 1,
    arrived: 2,
    fromStorage: 1,
    timestamp: consumeTimestamp
  };
  await updateConsume(consumeId, updatePayload);

  await deleteConsume(consumeId);

  await deleteFixtures(fixtures);
}

// Run entire consume lifecycle sequence
export async function runConsumeLifecycle() {
  console.log('=== Starting Consume Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else if (role === 'manager') {
    await runManagerChecks();
  } else {
    await runAdminLifecycle();
  }

  console.log('=== Consume Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runConsumeLifecycle();
}
