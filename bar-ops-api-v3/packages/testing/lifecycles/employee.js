import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createEmployee } from '../endpoints/employee/create.js';
import { getEmployee } from '../endpoints/employee/get.js';
import { listEmployees } from '../endpoints/employee/list.js';
import { updateEmployee } from '../endpoints/employee/update.js';
import { registerEmployee } from '../endpoints/employee/register.js';
import { deleteEmployee } from '../endpoints/employee/delete.js';
import { getEmployeeSummary } from '../endpoints/employee/summary.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { generateUniqueId, generateUniquePhone, extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden, assertFieldsDropped } from '../shared/role-assert.js';
import { managerDrops } from '../shared/role-matrix.js';

const EMPLOYEE_DROPS = managerDrops('employee');

function buildEmployeePayload() {
  return {
    "firstName": "TEST",
    "lastName": "TEST",
    "identityNumber": generateUniqueId(),
    "phone": generateUniquePhone(),
    "type": "waiter",
    "gender": "male"
  };
}

// Employee get/list return arrays; find the matching row
function findEmployee(response, id) {
  const data = extractData(response);
  if (Array.isArray(data)) return data.find(emp => emp.id === id);
  return data;
}

// The public register response is intentionally id-less (enumeration guard), so the
// registered row's id is resolved as admin by matching its
// already be in an admin context (list is admin/manager-only).
async function resolveRegisteredId(phone) {
  const data = extractData(await listEmployees());
  const match = Array.isArray(data) ? data.find(emp => emp.phone === phone) : null;
  return match ? match.id : null;
}

// User: 403 on every op, but public register must succeed
async function runUserChecks() {
  console.log('Running employee 403 checks as user...');
  await assertForbidden(() => createEmployee(buildEmployeePayload()), 'employee create as user');
  await assertForbidden(() => getEmployee(fakeId()), 'employee get as user');
  await assertForbidden(() => listEmployees([fakeId()]), 'employee list as user');
  await assertForbidden(() => updateEmployee(fakeId(), buildEmployeePayload()), 'employee update as user');
  await assertForbidden(() => deleteEmployee(fakeId()), 'employee delete as user');
  await assertForbidden(() => getEmployeeSummary(fakeId()), 'employee summary as user');

  // Public register route must stay open regardless of role
  const registerPayload = buildEmployeePayload();
  await registerEmployee(registerPayload);
  await asAdmin(async () => {
    const registeredId = await resolveRegisteredId(registerPayload.phone);
    assert.ok(registeredId, 'registered employee should be findable by phone as admin');
    await deleteEmployee(registeredId);
  });
  console.log('All employee user checks passed');
}

async function runManagerChecks() {
  console.log('Running employee manager checks...');
  await assertForbidden(() => createEmployee(buildEmployeePayload()), 'employee create as manager');
  await assertForbidden(() => updateEmployee(fakeId(), buildEmployeePayload()), 'employee update as manager');
  await assertForbidden(() => deleteEmployee(fakeId()), 'employee delete as manager');
  await assertForbidden(() => getEmployeeSummary(fakeId()), 'employee summary as manager');

  let employeeId;
  await asAdmin(async () => {
    employeeId = extractId(await createEmployee(buildEmployeePayload()));
  });

  try {
    const fetched = findEmployee(await getEmployee(employeeId), employeeId);
    assert.ok(fetched, 'employee get as manager should return the fixture');
    assertFieldsDropped(fetched, EMPLOYEE_DROPS, 'employee get as manager');

    const listed = findEmployee(await listEmployees([employeeId]), employeeId);
    assert.ok(listed, 'employee list as manager should contain the fixture');
    assertFieldsDropped(listed, EMPLOYEE_DROPS, 'employee list row as manager');
  } finally {
    await asAdmin(() => deleteEmployee(employeeId));
  }
  console.log('All employee manager checks passed');
}

async function runAdminLifecycle() {
  const createPayload = buildEmployeePayload();

  const createResponse = await createEmployee(createPayload);
  const id = extractId(createResponse);

  const fetchedEmployee = await getEmployee(id);
  let employeeTimestamp = new Date().toISOString();
  const employee = findEmployee(fetchedEmployee, id);
  if (employee && employee.timestamp) {
    employeeTimestamp = employee.timestamp;
  }

  await listEmployees([id]);

  const updatePayload = {
    "firstName": "UPDATE TEST",
    "lastName": "UPDATE TEST",
    "identityNumber": createPayload.identityNumber,
    "phone": createPayload.phone,
    "type": "waiter",
    "timestamp": employeeTimestamp
  };
  await updateEmployee(id, updatePayload);

  // so resolve the new row's id by its unique phone before cleanup.
  const registerPayload = buildEmployeePayload();
  await registerEmployee(registerPayload);
  const registeredId = await resolveRegisteredId(registerPayload.phone);
  assert.ok(registeredId, 'registered employee should be findable by phone');

  await deleteEmployee(id);
  await deleteEmployee(registeredId);
}

// Run entire employee lifecycle sequence
export async function runEmployeeLifecycle() {
  console.log('=== Starting Employee Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else if (role === 'manager') {
    await runManagerChecks();
  } else {
    await runAdminLifecycle();
  }

  console.log('=== Employee Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runEmployeeLifecycle();
}
