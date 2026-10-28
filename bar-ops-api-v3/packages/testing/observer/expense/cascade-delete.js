import assert from 'assert';
import { createClient } from '../../endpoints/client/create.js';
import { deleteClient } from '../../endpoints/client/delete.js';
import { createSession } from '../../endpoints/session/create.js';
import { getSession } from '../../endpoints/session/get.js';
import { createExpense } from '../../endpoints/expense/create.js';
import { getExpense } from '../../endpoints/expense/get.js';
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
  console.log('=== Starting Expense Cascade Delete Verification ===');

  const clientPayload = {
    "name": "Cascade Test Lounge",
    "brand": "Cascade Test Brand",
    "email": null,
    "phone": "0501234567"
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

  const expensePayload = {
    sessionId: sessionId,
    name: "Cascade Test Expense",
    amount: 50,
    desc: "Cascade Test Desc",
    paidBy: "house"
  };
  const expenseResponse = await createExpense(expensePayload);
  const expenseId = extractId(expenseResponse);

  // Verify session and expense can be fetched before deletion
  await getSession(sessionId);
  await getExpense(expenseId);

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

  console.log('Verifying Expense is cascade-deleted (with polling)...');
  await assertWithRetry(async () => {
    let expenseDeleted = false;
    try {
      await getExpense(expenseId);
    } catch (error) {
      if (error.status === 404) {
        expenseDeleted = true;
      } else {
        throw error;
      }
    }
    assert.ok(expenseDeleted, 'Expense should have been cascade-deleted after client deletion');
  });

  console.log('=== Expense Cascade Delete Verification Completed Successfully ===');
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCascadeDeleteTest();
}
