// Dev-only seed: a client, a session and employees with approved + pending shifts,
// so the pending registrations dialog can be checked by hand. Nothing is cleaned up.
// No registration link is opened, so no WhatsApp message is sent.
import { fileURLToPath } from 'url';
import process from 'process';
import { createClient } from '../endpoints/client/create.js';
import { createSession } from '../endpoints/session/create.js';
import { createEmployee } from '../endpoints/employee/create.js';
import { createShift } from '../endpoints/shift/create.js';
import { updateShift } from '../endpoints/shift/update.js';
import { selectUserRoleAndLogin } from '../shared/select-role.js';
import { generateUniqueId, generateUniquePhone, extractId, extractData } from '../shared/utils.js';

const SESSION_DATETIME = '2026-10-15T19:00:00Z';

// pending: true = shift is switched to PENDING, as if the employee self-registered
const EMPLOYEES = [
  { firstName: 'נועה', level: 'expert', type: 'bartender', role: 'bartender', pending: false,
    workExperience: '5 שנים ברמנית בבר קוקטיילים בתל אביב', instagram: 'noa.bar', address: 'תל אביב' },
  { firstName: 'איתי', level: 'junior', type: 'waiter', role: 'waiter', pending: false,
    workExperience: 'שנה מלצר באירועים', instagram: 'itay.w', address: 'רמת גן' },
  { firstName: 'מאיה', level: 'senior', type: 'bartender', role: 'bartender', pending: true,
    workExperience: '3 שנים ברמנית בחתונות ובאירועי חברה, כולל ניהול עמדת בר', instagram: 'maya.mix', address: 'חיפה' },
  { firstName: 'דניאל', level: 'trainee', type: 'waiter', role: 'runner', pending: true,
    workExperience: '', instagram: 'daniel.r', address: 'הרצליה' },
  // No level, no instagram, no address - old-style employee
  { firstName: 'יוסי', type: 'waiter', role: 'waiter', pending: true },
];

async function seed() {
  if ((process.env.STAGE || 'dev') !== 'dev') {
    throw new Error('Seed runs on the dev stage only');
  }

  await selectUserRoleAndLogin();

  const clientId = extractId(await createClient({
    name: 'לקוח בדיקה',
    brand: 'KICK Seed',
    email: null,
    phone: generateUniquePhone(),
  }));

  const sessionId = extractId(await createSession({
    clientId,
    datetime: SESSION_DATETIME,
    name: 'בדיקת בקשות משמרת',
    peopleAmount: 120,
    location: 'האנגר 11, תל אביב',
    processingFee: 2,
    type: 'hardstyle',
  }));

  for (const emp of EMPLOYEES) {
    const employeeId = extractId(await createEmployee({
      firstName: emp.firstName,
      lastName: 'בדיקה',
      identityNumber: generateUniqueId(),
      // Random number, never messaged: no registration link is opened
      phone: generateUniquePhone(),
      type: emp.type,
      ...(emp.level && { level: emp.level }),
      ...(emp.workExperience && { workExperience: emp.workExperience }),
      ...(emp.instagram && { instagram: emp.instagram }),
      ...(emp.address && { address: emp.address }),
    }));

    const shift = extractData(await createShift({
      sessionId,
      employeeId,
      role: emp.role,
      timing: SESSION_DATETIME,
    }));

    if (emp.pending) {
      await updateShift(shift.id, { registration: 'PENDING', timestamp: shift.timestamp });
    }
  }

  console.log('\n✅ Seed done');
  console.log(`   client:  ${clientId}`);
  console.log(`   session: ${sessionId} ("בדיקת בקשות משמרת")`);
  console.log(`   shifts:  ${EMPLOYEES.filter((e) => !e.pending).length} approved, ${EMPLOYEES.filter((e) => e.pending).length} pending`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
