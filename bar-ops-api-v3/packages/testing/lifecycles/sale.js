import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSale } from '../endpoints/sale/create.js';
import { getSale } from '../endpoints/sale/get.js';
import { listSales } from '../endpoints/sale/list.js';
import { updateSale } from '../endpoints/sale/update.js';
import { deleteSale } from '../endpoints/sale/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole } from '../shared/auth-guard.js';
import { extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

async function runForbiddenChecks(role) {
  console.log(`Running sale 403 checks as ${role}...`);
  const payload = { clientId: fakeId(), datetime: '2026-06-01T20:00:00Z', name: 'TEST' };
  await assertForbidden(() => createSale(payload), `sale create as ${role}`);
  await assertForbidden(() => getSale(fakeId()), `sale get as ${role}`);
  await assertForbidden(() => listSales({ clientId: fakeId(), monthYear: '2026-06' }), `sale list as ${role}`);
  await assertForbidden(() => listSales({ startDate: '2026-06-01', endDate: '2026-06-30' }), `sale list by date range as ${role}`);
  await assertForbidden(() => updateSale(fakeId(), payload), `sale update as ${role}`);
  await assertForbidden(() => deleteSale(fakeId()), `sale delete as ${role}`);
  console.log('All sale 403 checks passed');
}

async function runAdminLifecycle() {
  const clientPayload = {
    "name": "TEST",
    "brand": "TEST",
    "email": null,
    "phone": "0507799799"
  };
  const clientResponse = await createClient(clientPayload);
  const clientId = extractId(clientResponse);

  const salePayload = {
    "clientId": clientId,
    "datetime": "2026-06-01T20:00:00Z",
    "name": "TEST"
  };
  const saleResponse = await createSale(salePayload);
  const saleId = extractId(saleResponse);

  const fetchedSale = await getSale(saleId);
  let saleTimestamp = new Date().toISOString();
  if (fetchedSale.data && fetchedSale.data.data && fetchedSale.data.data.timestamp) {
    saleTimestamp = fetchedSale.data.data.timestamp;
  }
  assert.strictEqual(extractData(fetchedSale).paid, false, 'sale should default to paid: false on create');

  // List sales by clientId + monthYear (existing exact-month path)
  await listSales({ clientId: clientId, monthYear: '2026-06' });

  // List sales by clientId only (no monthYear/date range)
  const byClientOnly = extractData(await listSales({ clientId: clientId }));
  assert.ok(Array.isArray(byClientOnly) && byClientOnly.some(s => s.id === saleId), 'sale list by client only should contain the sale');

  // Date-range: day-precision within the sale's own month
  const inRange = extractData(await listSales({ clientId: clientId, startDate: '2026-06-01', endDate: '2026-06-01' }));
  assert.ok(Array.isArray(inRange) && inRange.some(s => s.id === saleId), 'sale list by date range should contain the sale on its exact day');

  const outOfRange = extractData(await listSales({ clientId: clientId, startDate: '2026-06-02', endDate: '2026-06-30' }));
  assert.ok(!Array.isArray(outOfRange) || !outOfRange.some(s => s.id === saleId), 'sale list by date range should exclude the sale outside its day');

  // Date-range spanning multiple months, no clientId (exercises the per-month Query loop)
  const crossMonth = extractData(await listSales({ startDate: '2026-05-15', endDate: '2026-07-15' }));
  assert.ok(Array.isArray(crossMonth) && crossMonth.some(s => s.id === saleId), 'sale list by cross-month date range should contain the sale');

  const updatePayload = {
    "clientId": clientId,
    "datetime": "2026-06-01T20:00:00Z",
    "name": "TEST",
    "paid": true,
    "timestamp": saleTimestamp
  };
  await updateSale(saleId, updatePayload);

  const updatedSale = await getSale(saleId);
  assert.strictEqual(extractData(updatedSale).paid, true, 'sale paid should be true after update');

  await deleteSale(saleId);

  await deleteClient(clientId);
}

// Run entire sale lifecycle sequence
export async function runSaleLifecycle() {
  console.log('=== Starting Sale Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'admin') {
    await runAdminLifecycle();
  } else {
    await runForbiddenChecks(role);
  }

  console.log('=== Sale Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runSaleLifecycle();
}
