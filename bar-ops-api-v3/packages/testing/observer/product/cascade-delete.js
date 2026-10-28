// Import external framework dependencies and status codes from third party packages
import assert from 'assert';
import { createSupplier } from '../../endpoints/supplier/create.js';
import { deleteSupplier } from '../../endpoints/supplier/delete.js';
import { createProduct } from '../../endpoints/product/create.js';
import { getProduct } from '../../endpoints/product/get.js';
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
    assert.ok(deleted, `${name} should have been cascade-deleted after supplier deletion`);
  });
}

// Run the cascade delete test configuration setting for module execution
export async function runCascadeDeleteTest() {
  await selectUserRoleAndLogin();
  console.log('=== Starting Product Cascade Delete Verification ===');

  const supplierPayload = {
    "name": "Cascade Test Supplier",
    "phone": "123456789",
    "contactName": "Cascade Test Contact",
    "address": "Cascade Test Address",
    "notes": "Cascade Test Notes"
  };
  const supplierResponse = await createSupplier(supplierPayload);
  const supplierId = extractId(supplierResponse);

  const productPayload = {
    "supplierId": supplierId,
    "name": "Beer Bottle",
    "price": 5,
    "volume": 330,
    "type": "alcohol",
    "quantity": 24,
    "isBase": true
  };
  const productResponse = await createProduct(productPayload);
  const productId = extractId(productResponse);

  // Verify product can be fetched before deletion configuration setting for
  await getProduct(productId);

  console.log(`Deleting Supplier: ${supplierId}...`);
  await deleteSupplier(supplierId);

  await assertCascadeDeleted('Product', () => getProduct(productId));

  console.log('=== Product Cascade Delete Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCascadeDeleteTest();
}
