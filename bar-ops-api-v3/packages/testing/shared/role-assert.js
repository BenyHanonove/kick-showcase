import assert from 'assert';
import { getTestRole } from './auth-guard.js';
import { managerDrops } from './role-matrix.js';

export async function assertForbidden(fn, label = 'operation') {
  let error = null;
  try {
    await fn();
  } catch (err) {
    error = err;
  }
  assert.ok(error, `${label}: expected 403 Forbidden but request succeeded`);
  assert.notStrictEqual(error.status, 401, `${label}: got 401 Unauthorized - credential problem, not a permission check`);
  assert.strictEqual(error.status, 403, `${label}: expected 403 Forbidden but got ${error.status ?? error.message}`);
}

// Expect fn to throw a 404 (e.g. manager fetching a non-active session)
export async function assertNotFound(fn, label = 'operation') {
  let error = null;
  try {
    await fn();
  } catch (err) {
    error = err;
  }
  assert.ok(error, `${label}: expected 404 Not Found but request succeeded`);
  assert.strictEqual(error.status, 404, `${label}: expected 404 Not Found but got ${error.status ?? error.message}`);
}

// Assert every listed field is absent from the object
export function assertFieldsDropped(obj, fields, label = 'response') {
  assert.ok(obj && typeof obj === 'object', `${label}: expected an object to check dropped fields`);
  for (const field of fields) {
    assert.ok(!(field in obj), `${label}: field "${field}" should be dropped for this role`);
  }
}

// Assert every listed field is present on the object
export function assertFieldsPresent(obj, fields, label = 'response') {
  assert.ok(obj && typeof obj === 'object', `${label}: expected an object to check present fields`);
  for (const field of fields) {
    assert.ok(field in obj, `${label}: field "${field}" should be present for this role`);
  }
}

// Assert the object matches the current role's view of the entity (manager-dropped fields absent)
export function assertRoleView(entity, obj, label = entity) {
  const drops = managerDrops(entity);
  if (drops.length === 0) return;
  if (getTestRole() === 'manager') {
    assertFieldsDropped(obj, drops, label);
  } else {
    assertFieldsPresent(obj, drops, label);
  }
}
