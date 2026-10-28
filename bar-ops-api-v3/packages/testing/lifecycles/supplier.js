// Import external framework dependencies and status codes from third party packages
import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createSupplier } from '../endpoints/supplier/create.js';
import { getSupplier } from '../endpoints/supplier/get.js';
import { listSuppliers } from '../endpoints/supplier/list.js';
import { updateSupplier } from '../endpoints/supplier/update.js';
import { deleteSupplier } from '../endpoints/supplier/delete.js';
import { getSupplierSummary } from '../endpoints/supplier/summary.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

const SUPPLIER_PAYLOAD = {
  "name": "TEST",
  "phone": "0500000000",
  "contactName": "TEST",
  "address": "TEST",
  "notes": "TEST"
};

// User must 403 on every supplier op configuration setting for
async function runUserChecks() {
  console.log('Running supplier 403 checks as user...');
  await assertForbidden(() => createSupplier(SUPPLIER_PAYLOAD), 'supplier create as user');
  await assertForbidden(() => getSupplier(fakeId()), 'supplier get as user');
  await assertForbidden(() => listSuppliers([fakeId()]), 'supplier list as user');
  await assertForbidden(() => updateSupplier(fakeId(), SUPPLIER_PAYLOAD), 'supplier update as user');
  await assertForbidden(() => deleteSupplier(fakeId()), 'supplier delete as user');
  await assertForbidden(() => getSupplierSummary(fakeId(), '2026-06'), 'supplier summary as user');
  console.log('All supplier 403 checks passed');
}

// Manager: writes and summary forbidden, reads succeed configuration setting for
async function runManagerChecks() {
  console.log('Running supplier manager checks...');
  await assertForbidden(() => createSupplier(SUPPLIER_PAYLOAD), 'supplier create as manager');
  await assertForbidden(() => updateSupplier(fakeId(), SUPPLIER_PAYLOAD), 'supplier update as manager');
  await assertForbidden(() => deleteSupplier(fakeId()), 'supplier delete as manager');
  await assertForbidden(() => getSupplierSummary(fakeId(), '2026-06'), 'supplier summary as manager');

  let supplierId;
  await asAdmin(async () => {
    supplierId = extractId(await createSupplier(SUPPLIER_PAYLOAD));
  });

  try {
    const supplier = extractData(await getSupplier(supplierId));
    assert.strictEqual(supplier.id, supplierId, 'supplier get as manager should return the fixture');

    const suppliers = extractData(await listSuppliers([supplierId]));
    assert.ok(Array.isArray(suppliers) && suppliers.some(s => s.id === supplierId), 'supplier list as manager should contain the fixture');
  } finally {
    await asAdmin(() => deleteSupplier(supplierId));
  }
  console.log('All supplier manager checks passed');
}

async function runAdminLifecycle() {
  const createResponse = await createSupplier(SUPPLIER_PAYLOAD);
  const id = extractId(createResponse);

  const fetchedSupplier = await getSupplier(id);
  let supplierTimestamp = new Date().toISOString();
  if (fetchedSupplier.data && fetchedSupplier.data.data && fetchedSupplier.data.data.timestamp) {
    supplierTimestamp = fetchedSupplier.data.data.timestamp;
  }

  await listSuppliers([id]);

  const updatePayload = {
    "name": "TEST",
    "phone": "0501111111",
    "contactName": "TEST",
    "address": "TEST",
    "notes": "TEST",
    "timestamp": supplierTimestamp
  };
  await updateSupplier(id, updatePayload);

  await deleteSupplier(id);
}

// Run entire supplier lifecycle sequence configuration setting for module execution
export async function runSupplierLifecycle() {
  console.log('=== Starting Supplier Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else if (role === 'manager') {
    await runManagerChecks();
  } else {
    await runAdminLifecycle();
  }

  console.log('=== Supplier Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runSupplierLifecycle();
}
