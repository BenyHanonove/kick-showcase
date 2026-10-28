import assert from 'assert';
import { createClient } from '../../endpoints/client/create.js';
import { deleteClient } from '../../endpoints/client/delete.js';
import { createSession } from '../../endpoints/session/create.js';
import { getSession } from '../../endpoints/session/get.js';
import { createSupplier } from '../../endpoints/supplier/create.js';
import { deleteSupplier } from '../../endpoints/supplier/delete.js';
import { createProduct } from '../../endpoints/product/create.js';
import { deleteProduct } from '../../endpoints/product/delete.js';
import { createConsume } from '../../endpoints/consume/create.js';
import { getConsume } from '../../endpoints/consume/get.js';
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

// Run the cascade delete test
export async function runCascadeDeleteTest() {
  await selectUserRoleAndLogin();
  console.log('=== Starting Consume Cascade Delete Verification ===');

  const clientPayload = {
    "name": "Cascade Test Lounge",
    "brand": "Cascade Test Brand",
    "email": null,
    "phone": "0507799799"
  };
  const clientResponse = await createClient(clientPayload);
  const clientId = extractId(clientResponse);

  const sessionPayload = {
    "clientId": clientId,
    "datetime": "2026-06-01T10:00:00Z",
    "name": "Cascade Test Shift",
    "peopleAmount": 50,
    "location": "Main Hall",
    "processingFee": 2,
    "type": "hardstyle"
  };
  const sessionResponse = await createSession(sessionPayload);
  const sessionId = extractId(sessionResponse);

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

  const consume1Payload = {
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
  const consume1Response = await createConsume(consume1Payload);
  const consume1Id = extractId(consume1Response);

  const consume2Payload = {
    sessionId: sessionId,
    productId: productId,
    chargedPrice: 20,
    supplierPrice: 8,
    target: 3,
    order: 2,
    arrived: 2,
    fromStorage: 0,
    creditedToSupplier: 0,
    returnedToStorage: 0
  };
  const consume2Response = await createConsume(consume2Payload);
  const consume2Id = extractId(consume2Response);

  const consume3Payload = {
    sessionId: sessionId,
    productId: productId,
    chargedPrice: 25,
    supplierPrice: 10,
    target: 4,
    order: 3,
    arrived: 3,
    fromStorage: 2,
    creditedToSupplier: 1,
    returnedToStorage: 0
  };
  const consume3Response = await createConsume(consume3Payload);
  const consume3Id = extractId(consume3Response);

  // Verify session and consumes can be fetched before deletion
  await getSession(sessionId);
  await getConsume(consume1Id);
  await getConsume(consume2Id);
  await getConsume(consume3Id);

  console.log(`Deleting Client: ${clientId}...`);
  await deleteClient(clientId);

  console.log('Verifying Session is cascade-deleted (with polling)...');
  await assertWithRetry(async () => {
    let sessionDeleted = false;
    try {
      await getSession(sessionId);
    } catch (error) {
      if (error.status === 404) {
        sessionDeleted = true;
      } else {
        throw error;
      }
    }
    assert.ok(sessionDeleted, 'Session should have been cascade-deleted after client deletion');
  });

  // Verify Consume 1 is deleted (with polling)
  console.log('Verifying Consume 1 is cascade-deleted (with polling)...');
  await assertWithRetry(async () => {
    let consume1Deleted = false;
    try {
      await getConsume(consume1Id);
    } catch (error) {
      if (error.status === 404) {
        consume1Deleted = true;
      } else {
        throw error;
      }
    }
    assert.ok(consume1Deleted, 'Consume 1 should have been cascade-deleted after client deletion');
  });

  // Verify Consume 2 is deleted (with polling)
  console.log('Verifying Consume 2 is cascade-deleted (with polling)...');
  await assertWithRetry(async () => {
    let consume2Deleted = false;
    try {
      await getConsume(consume2Id);
    } catch (error) {
      if (error.status === 404) {
        consume2Deleted = true;
      } else {
        throw error;
      }
    }
    assert.ok(consume2Deleted, 'Consume 2 should have been cascade-deleted after client deletion');
  });

  // Verify Consume 3 is deleted (with polling)
  console.log('Verifying Consume 3 is cascade-deleted (with polling)...');
  await assertWithRetry(async () => {
    let consume3Deleted = false;
    try {
      await getConsume(consume3Id);
    } catch (error) {
      if (error.status === 404) {
        consume3Deleted = true;
      } else {
        throw error;
      }
    }
    assert.ok(consume3Deleted, 'Consume 3 should have been cascade-deleted after client deletion');
  });

  await deleteProduct(productId);
  await deleteSupplier(supplierId);

  console.log('=== Consume Cascade Delete Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCascadeDeleteTest();
}
