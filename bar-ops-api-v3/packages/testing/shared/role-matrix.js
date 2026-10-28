import { getTestRole } from './auth-guard.js';

const A = ['admin'];
const AM = ['admin', 'manager'];

// Per-entity allowed roles per op + manager view rules, mirroring
export const MATRIX = {
  cashier: {
    ops: { create: AM, get: AM, list: AM, update: AM, delete: AM, presign: AM, unsign: AM }
  },
  client: {
    ops: { create: A, get: AM, list: AM, update: A, delete: A }
  },
  consume: {
    ops: { create: AM, get: AM, list: AM, update: AM, delete: AM },
    managerDrops: ['chargedPrice'],
    updateStripsDrops: true
  },
  employee: {
    ops: { create: A, get: AM, list: AM, update: A, delete: A, summary: A },
    managerDrops: ['identityNumber']
  },
  expense: {
    ops: { create: A, get: A, list: A, update: A, delete: A, presign: A, unsign: A }
  },
  interval: {
    ops: { create: AM, get: AM, list: AM, update: AM, delete: AM }
  },
  mission: {
    ops: { create: A, get: AM, list: AM, update: A, delete: A }
  },
  product: {
    ops: { create: A, get: AM, list: AM, update: A, delete: A },
    managerDrops: ['price']
  },
  reservation: {
    ops: { get: AM, list: AM, update: A, delete: A }
  },
  sale: {
    ops: { create: A, get: A, list: A, update: A, delete: A, summary: A }
  },
  session: {
    ops: { create: A, get: AM, list: AM, update: A, delete: A, summary: A },
    managerActiveOnly: true
  },
  shift: {
    ops: { create: AM, get: AM, list: AM, update: AM, delete: A },
    managerDrops: ['bonusTravel', 'bonusManage', 'bonusOther', 'bonusSetup', 'hourly'],
    updateStripsDrops: true
  },
  supplier: {
    ops: { create: A, get: AM, list: AM, update: A, delete: A, summary: A }
  },
  tips: {
    ops: { create: A, get: A, list: A, update: A, delete: A }
  },
  vehicle: {
    ops: { create: AM, get: AM, list: AM, update: AM, delete: AM }
  }
};

// Check if a role may perform an op on an entity
export function canDo(entity, op, role = getTestRole()) {
  return MATRIX[entity].ops[op].includes(role);
}

// Fields dropped from manager responses for an entity
export function managerDrops(entity) {
  return MATRIX[entity].managerDrops || [];
}
