import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { ensureAuth, getTestRole } from './auth-guard.js';

export async function selectUserRoleAndLogin() {
  if (process.env.TEST_ROLE || !process.stdin.isTTY) {
    const role = getTestRole();
    console.log(`Logging in as ${role} (TEST_ROLE${process.env.TEST_ROLE ? '' : ' default'})...`);
    await ensureAuth();
    return;
  }

  const rl = readline.createInterface({ input, output });
  try {
    const promptMessage = `Which user type?
1. Admin
2. Manager
3. User
Insert number [1]: `;
    const answer = await rl.question(promptMessage);
    const choice = answer.trim();

    // Write choice back so lifecycle assertions branch on the same role
    if (choice === '2') {
      process.env.TEST_ROLE = 'manager';
    } else if (choice === '3') {
      process.env.TEST_ROLE = 'user';
    } else {
      process.env.TEST_ROLE = 'admin';
    }
    console.log(`Logging in as ${process.env.TEST_ROLE}...`);
    await ensureAuth();
  } finally {
    rl.close();
  }
}
