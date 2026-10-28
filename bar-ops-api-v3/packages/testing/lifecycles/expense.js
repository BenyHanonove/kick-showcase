import { fileURLToPath } from 'url';
import process from 'process';
import { createClient } from '../endpoints/client/create.js';
import { deleteClient } from '../endpoints/client/delete.js';
import { createSession } from '../endpoints/session/create.js';
import { deleteSession } from '../endpoints/session/delete.js';
import { createExpense } from '../endpoints/expense/create.js';
import { getExpense } from '../endpoints/expense/get.js';
import { listExpenses } from '../endpoints/expense/list.js';
import { updateExpense } from '../endpoints/expense/update.js';
import { presignExpense } from '../endpoints/expense/presign.js';
import { unsignExpense } from '../endpoints/expense/unsign.js';
import { deleteExpense } from '../endpoints/expense/delete.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole } from '../shared/auth-guard.js';
import { extractId, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

async function runForbiddenChecks(role) {
  console.log(`Running expense 403 checks as ${role}...`);
  const payload = { sessionId: fakeId(), name: 'TEST', amount: 50, desc: 'TEST', paidBy: 'house' };
  await assertForbidden(() => createExpense(payload), `expense create as ${role}`);
  await assertForbidden(() => getExpense(fakeId()), `expense get as ${role}`);
  await assertForbidden(() => listExpenses({ sessionId: fakeId() }), `expense list as ${role}`);
  await assertForbidden(() => updateExpense(fakeId(), payload), `expense update as ${role}`);
  await assertForbidden(() => presignExpense({ file: 'x.jpg', sessionId: fakeId(), id: fakeId(), filename: 'x.jpg' }), `expense presign as ${role}`);
  await assertForbidden(() => unsignExpense({ id: fakeId() }), `expense unsign as ${role}`);
  await assertForbidden(() => deleteExpense(fakeId()), `expense delete as ${role}`);
  console.log('All expense 403 checks passed');
}

async function runAdminLifecycle() {
  const clientPayload = {
    "name": "TEST",
    "brand": "TEST",
    "email": null,
    "phone": "0501234567"
  };
  const clientResponse = await createClient(clientPayload);
  const clientId = extractId(clientResponse);

  const sessionPayload = {
    "clientId": clientId,
    "datetime": "2026-06-01T10:00:00Z",
    "name": "TEST",
    "peopleAmount": 50,
    "location": "TEST",
    "processingFee": 2,
    "type": "hardstyle"
  };
  const sessionResponse = await createSession(sessionPayload);
  const sessionId = extractId(sessionResponse);

  const expensePayload = {
    sessionId: sessionId,
    name: "TEST",
    amount: 50,
    desc: "TEST",
    paidBy: "house"
  };
  const expenseResponse = await createExpense(expensePayload);
  const expenseId = extractId(expenseResponse);

  const fetchedExpense = await getExpense(expenseId);
  let expenseTimestamp = new Date().toISOString();
  if (fetchedExpense.data && fetchedExpense.data.data && fetchedExpense.data.data.timestamp) {
    expenseTimestamp = fetchedExpense.data.data.timestamp;
  }

  await listExpenses({ sessionId: sessionId });

  const updatePayload = {
    name: "UPDATE TEST",
    amount: 60,
    desc: "UPDATE TEST",
    paidBy: "house",
    timestamp: expenseTimestamp
  };
  await updateExpense(expenseId, updatePayload);

  const presignPayload = {
    file: 'expense.jpg',
    sessionId: sessionId,
    id: expenseId,
    filename: 'expense.jpg'
  };
  await presignExpense(presignPayload);

  const unsignPayload = {
    id: expenseId
  };
  await unsignExpense(unsignPayload);

  await deleteExpense(expenseId);

  await deleteSession(sessionId);

  await deleteClient(clientId);
}

// Run entire expense lifecycle sequence
export async function runExpenseLifecycle() {
  console.log('=== Starting Expense Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'admin') {
    await runAdminLifecycle();
  } else {
    await runForbiddenChecks(role);
  }

  console.log('=== Expense Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runExpenseLifecycle();
}
