import { fileURLToPath } from 'url';
import process from 'process';
import assert from 'assert';
import { createEmployee } from '../endpoints/employee/create.js';
import { getEmployee } from '../endpoints/employee/get.js';
import { deleteEmployee } from '../endpoints/employee/delete.js';
import { linkEmployee } from '../endpoints/employee/link.js';
import { resolveEmployeeLink } from '../endpoints/employee/resolve.js';
import { claimEmployeeLink } from '../endpoints/employee/claim.js';
import { revokeEmployeeLink } from '../endpoints/employee/revoke.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { getTestRole, asAdmin } from '../shared/auth-guard.js';
import { generateUniqueId, VERIFIED_TEST_PHONE, extractId, extractData, fakeId } from '../shared/utils.js';
import { assertForbidden } from '../shared/role-assert.js';

function buildEmployeePayload() {
  return {
    "firstName": "TEST",
    "lastName": "TEST",
    "identityNumber": generateUniqueId(),
    "phone": VERIFIED_TEST_PHONE,
    "type": "waiter",
    "gender": "male",
    "workExperience": "שנתיים כברמן",
    "instagram": "test.employee",
    "address": "רוטשילד 1, תל אביב"
  };
}

// Employee get returns an array; find the matching row
function findEmployee(response, id) {
  const data = extractData(response);
  if (Array.isArray(data)) return data.find(emp => emp.id === id);
  return data;
}

// User: 403 on the admin-only token actions
async function runUserChecks() {
  console.log('Running employee-token 403 checks as user...');
  await assertForbidden(() => linkEmployee(fakeId()), 'employee link as user');
  await assertForbidden(() => revokeEmployeeLink(fakeId()), 'employee revoke as user');
  console.log('All employee-token user checks passed');
}

// Manager: writes forbidden, same as user for this module
async function runManagerChecks() {
  console.log('Running employee-token 403 checks as manager...');
  await assertForbidden(() => linkEmployee(fakeId()), 'employee link as manager');
  await assertForbidden(() => revokeEmployeeLink(fakeId()), 'employee revoke as manager');
  console.log('All employee-token manager checks passed');
}

// Full link -> resolve -> claim flow as admin
async function runAdminLifecycle() {
  const createPayload = buildEmployeePayload();
  const id = extractId(await createEmployee(createPayload));

  try {
    const linkResponse = await linkEmployee(id);
    const token = extractData(linkResponse).token;
    assert.ok(token, 'link should return a token');

    // Employee resolves the token (public, no auth) to prefill the form
    const resolved = await resolveEmployeeLink(token);
    const resolvedData = extractData(resolved);
    assert.ok(resolvedData, 'resolve should return employee data for a valid token');

    // Employee claims the link, submitting changes (public, no auth)
    // ClaimEmployeeDto requires the full self-editable field set, so echo back
    // whatever resolve returned for the fields we're not intentionally changing
    const claimPayload = {
      firstName: "CLAIMED",
      lastName: "CLAIMED",
      identityNumber: resolvedData.identityNumber,
      phone: resolvedData.phone,
      workExperience: resolvedData.workExperience,
      instagram: resolvedData.instagram,
      address: resolvedData.address,
      timestamp: resolvedData.timestamp
    };
    await claimEmployeeLink(token, claimPayload);

    const afterClaim = findEmployee(await getEmployee(id), id);
    assert.strictEqual(afterClaim.firstName, "CLAIMED", 'claim should update firstName');

    // Re-claiming with the same token should fail (single-use enforcement)
    let reclaimError = null;
    try {
      await claimEmployeeLink(token, claimPayload);
    } catch (err) {
      reclaimError = err;
    }
    assert.ok(reclaimError, 'reusing a claimed token should fail');

    let unknownTokenError = null;
    try {
      await resolveEmployeeLink('not-a-real-token');
    } catch (err) {
      unknownTokenError = err;
    }
    assert.ok(unknownTokenError, 'resolving an unknown token should fail');

    // Admin can revoke a fresh, unclaimed link early
    const secondLinkResponse = await linkEmployee(id);
    const secondToken = extractData(secondLinkResponse).token;
    assert.ok(secondToken, 'second link should return a token');

    await revokeEmployeeLink(id);

    let revokedResolveError = null;
    try {
      await resolveEmployeeLink(secondToken);
    } catch (err) {
      revokedResolveError = err;
    }
    assert.ok(revokedResolveError, 'resolving a revoked token should fail');
  } finally {
    await deleteEmployee(id);
  }
}

// Run entire employee-token lifecycle sequence
export async function runEmployeeTokenLifecycle() {
  console.log('=== Starting Employee Token Lifecycle Flow ===');

  await selectUserRoleAndLogin();
  const role = getTestRole();

  if (role === 'user') {
    await runUserChecks();
  } else if (role === 'manager') {
    await runManagerChecks();
  } else {
    await runAdminLifecycle();
  }

  console.log('=== Employee Token Lifecycle Flow Completed ===');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runEmployeeTokenLifecycle();
}
