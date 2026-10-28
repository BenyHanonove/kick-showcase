import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSale } from '../endpoints/sale/create.js';
import { deleteSale } from '../endpoints/sale/delete.js';
import { getSalesSummaryByMonth } from '../endpoints/sale/summary-by-month.js';
import { createSupplier } from '../endpoints/supplier/create.js';
import { deleteSupplier } from '../endpoints/supplier/delete.js';
import { createProduct } from '../endpoints/product/create.js';
import { deleteProduct } from '../endpoints/product/delete.js';
import { createConsume } from '../endpoints/consume/create.js';
import { deleteConsume } from '../endpoints/consume/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole } from '../shared/auth-guard.js';
import { extractId, extractData } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

const MONTH_YEAR = '2026-06';

// Sale summary is admin-only: every op must 403 for manager and user
async function runForbiddenChecks(role) {
  console.log(`Running sale summary 403 checks as ${role}...`);
  await assertForbidden(() => getSalesSummaryByMonth(MONTH_YEAR), `sale summary as ${role}`);
  console.log('All sale summary 403 checks passed');
}

// Admin creates the client/sale/supplier/product/consume fixtures the summary depends on
async function createFixtures() {
  const clientResponse = await createClient({ name: 'TEST', brand: 'TEST', email: null, phone: '0507799799' });
  const clientId = extractId(clientResponse);

  const saleResponse = await createSale({
    clientId: clientId,
    datetime: `${MONTH_YEAR}-01T20:00:00Z`,
    name: 'TEST',
  });
  const saleId = extractId(saleResponse);

  const supplierResponse = await createSupplier({ name: 'TEST', phone: '123456789', contactName: 'TEST', address: 'TEST', notes: 'TEST' });
  const supplierId = extractId(supplierResponse);

  const productResponse = await createProduct({
    supplierId: supplierId,
    name: 'Beer Bottle',
    price: 5,
    volume: 330,
    type: 'alcohol',
    quantity: 24,
    isBase: true,
  });
  const productId = extractId(productResponse);

  // consumes hang off the sale via the shared "sessionId" field
  const consumeResponse = await createConsume({
    sessionId: saleId,
    productId: productId,
    chargedPrice: 15,
    supplierPrice: 5,
    target: 2,
    order: 1,
    arrived: 2,
    fromStorage: 0,
    creditedToSupplier: 0,
    returnedToStorage: 0,
  });
  const consumeId = extractId(consumeResponse);

  return { clientId, saleId, supplierId, productId, consumeId };
}

async function deleteFixtures({ clientId, saleId, supplierId, productId, consumeId }) {
  await deleteConsume(consumeId);
  await deleteSale(saleId);
  await deleteClient(clientId);
  await deleteProduct(productId);
  await deleteSupplier(supplierId);
}

// Full flow as admin: build a sale with consumes, then check its monthly cost/sold totals
async function runAdminLifecycle() {
  const fixtures = await createFixtures();

  try {
    const summaries = extractData(await getSalesSummaryByMonth(MONTH_YEAR));
    assert.ok(Array.isArray(summaries), 'sale summary by month should return an array');

    const summary = summaries.find((s) => s.id === fixtures.saleId);
    assert.ok(summary, 'sale summary by month should contain the created sale');

    assert.strictEqual(typeof summary.costPrice, 'number', 'summary.costPrice should be a number');
    assert.strictEqual(typeof summary.soldPrice, 'number', 'summary.soldPrice should be a number');

    // 2 consumed (arrived + fromStorage - creditedToSupplier) * unit price
    assert.strictEqual(summary.costPrice, 10, 'summary.costPrice should equal consumed qty * supplierPrice');
    assert.strictEqual(summary.soldPrice, 30, 'summary.soldPrice should equal consumed qty * chargedPrice');
  } finally {
    await deleteFixtures(fixtures);
  }
}

// Run entire sale summary lifecycle sequence
export async function runSummaryLifecycle() {
  console.log('=== Starting Sale Summary Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'admin') {
    await runAdminLifecycle();
  } else {
    await runForbiddenChecks(role);
  }

  console.log('=== Sale Summary Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runSummaryLifecycle();
}
