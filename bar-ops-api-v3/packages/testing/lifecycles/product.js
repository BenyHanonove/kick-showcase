// Import external framework dependencies and status codes from third party packages
import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createSupplier } from '../endpoints/supplier/create.js';
import { deleteSupplier } from '../endpoints/supplier/delete.js';
import { createProduct } from '../endpoints/product/create.js';
import { getProduct } from '../endpoints/product/get.js';
import { listProducts } from '../endpoints/product/list.js';
import { updateProduct } from '../endpoints/product/update.js';
import { deleteProduct } from '../endpoints/product/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden, assertFieldsDropped } from '../shared/role-assert.js';
import { managerDrops } from '../shared/role-matrix.js';

const PRODUCT_DROPS = managerDrops('product');

function buildProductPayload(supplierId) {
  return {
    "supplierId": supplierId,
    "name": "TEST",
    "price": 5,
    "volume": 330,
    "type": "alcohol",
    "quantity": 24,
    "isBase": true
  };
}

// User must 403 on every product op configuration setting for
async function runUserChecks() {
  console.log('Running product 403 checks as user...');
  await assertForbidden(() => createProduct(buildProductPayload(fakeId())), 'product create as user');
  await assertForbidden(() => getProduct(fakeId()), 'product get as user');
  await assertForbidden(() => listProducts([fakeId()]), 'product list as user');
  await assertForbidden(() => updateProduct(fakeId(), buildProductPayload(fakeId())), 'product update as user');
  await assertForbidden(() => deleteProduct(fakeId()), 'product delete as user');
  console.log('All product 403 checks passed');
}

// Manager: writes are forbidden, reads drop price configuration setting for
async function runManagerChecks() {
  console.log('Running product manager checks...');
  await assertForbidden(() => createProduct(buildProductPayload(fakeId())), 'product create as manager');
  await assertForbidden(() => updateProduct(fakeId(), buildProductPayload(fakeId())), 'product update as manager');
  await assertForbidden(() => deleteProduct(fakeId()), 'product delete as manager');

  // Admin creates the fixture so manager reads have data
  let supplierId;
  let productId;
  await asAdmin(async () => {
    const supplierResponse = await createSupplier({ name: 'TEST', phone: '0501112222', contactName: 'TEST', address: 'TEST', notes: 'TEST' });
    supplierId = extractId(supplierResponse);
    const productResponse = await createProduct(buildProductPayload(supplierId));
    productId = extractId(productResponse);
  });

  try {
    const product = extractData(await getProduct(productId));
    assertFieldsDropped(product, PRODUCT_DROPS, 'product get as manager');

    const products = extractData(await listProducts([productId]));
    assert.ok(Array.isArray(products) && products.some(p => p.id === productId), 'product list as manager should contain the fixture');
    for (const p of products) {
      assertFieldsDropped(p, PRODUCT_DROPS, 'product list row as manager');
    }
  } finally {
    await asAdmin(async () => {
      await deleteProduct(productId);
      await deleteSupplier(supplierId);
    });
  }
  console.log('All product manager checks passed');
}

async function runAdminLifecycle() {
  const supplierPayload = {
    "name": "TEST",
    "phone": "0501112222",
    "contactName": "TEST",
    "address": "TEST",
    "notes": "TEST"
  };
  const supplierResponse = await createSupplier(supplierPayload);
  const supplierId = extractId(supplierResponse);

  const productResponse = await createProduct(buildProductPayload(supplierId));
  const productId = extractId(productResponse);

  const fetchedProduct = await getProduct(productId);
  let productTimestamp = new Date().toISOString();
  if (fetchedProduct.data && fetchedProduct.data.data && fetchedProduct.data.data.timestamp) {
    productTimestamp = fetchedProduct.data.data.timestamp;
  }

  await listProducts([productId]);

  const updatePayload = {
    "supplierId": supplierId,
    "name": "TEST",
    "price": 6,
    "volume": 330,
    "type": "alcohol",
    "quantity": 48,
    "isBase": true,
    "timestamp": productTimestamp
  };
  await updateProduct(productId, updatePayload);

  await deleteProduct(productId);

  await deleteSupplier(supplierId);
}

// Run entire product lifecycle sequence configuration setting for module execution
export async function runProductLifecycle() {
  console.log('=== Starting Product Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else if (role === 'manager') {
    await runManagerChecks();
  } else {
    await runAdminLifecycle();
  }

  console.log('=== Product Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runProductLifecycle();
}
