// Import external framework dependencies and status codes from third party packages
import { spawn } from 'child_process';
import { readdir, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, relative, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testingDir = join(__dirname, '..');
const repoRoot = join(testingDir, '..', '..');

const ROLES = ['admin', 'manager', 'user'];

// Each test file logs into Cognito independently (separate process, no shared
// token cache), so running them all at once bursts InitiateAuth and trips
// Cognito's own throttle. Cap concurrency to keep that burst small.
const CONCURRENCY = 5;

// Run tasks with at most `limit` in flight at a time
async function runInBatches(items, limit, task) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...await Promise.all(batch.map(task)));
  }
  return results;
}

// WhatsApp service retired - these suites call the WhatsApp lambdas
// (shift/open, employee/link), so the pipeline never runs them
const WHATSAPP_SUITES = ['shift-registration.js', 'employee-token.js'];
const SKIP = [...WHATSAPP_SUITES];

// These create an employee on VERIFIED_TEST_PHONE - the only allow-listed WhatsApp
// recipient, so the number cannot be randomized. Employee create rejects a duplicate
// phone with 409, so two of them overlapping fails whichever
// creates the fixture (non-admin paths go through asAdmin), so they
const EXCLUSIVE = ['shift-registration.js', 'shift.js', 'employee-token.js'];

// Collect runnable tests for a role: lifecycles always, observer suites admin-only
async function collectTestFiles(role) {
  const lifecyclesDir = join(testingDir, 'lifecycles');
  const observerDir = join(testingDir, 'observer');

  const lifecycleFiles = (await readdir(lifecyclesDir))
    .filter(f => f.endsWith('.js') && !SKIP.includes(f))
    .map(f => join(lifecyclesDir, f));

  // Observer tests validate stream side effects, not authorization
  if (role !== 'admin') return lifecycleFiles;

  const observerFiles = (await readdir(observerDir, { recursive: true }))
    .filter(f => f.endsWith('.js') && !SKIP.includes(f))
    .map(f => join(observerDir, f));

  return [...lifecycleFiles, ...observerFiles];
}

// Run a single test file as a child process, loading
function runTestFile(filePath, stage, role, envFile) {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn('node', [`--env-file=${envFile}`, filePath], {
      env: { ...process.env, STAGE: stage, TEST_ROLE: role }
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      resolve({
        file: relative(testingDir, filePath),
        code,
        stdout,
        stderr,
        duration: ((Date.now() - start) / 1000).toFixed(2)
      });
    });
  });
}

// Run every test for a single role; resolves true if all passed
async function runRoleTests(stage, role, envFile, runLogsDir) {
  const files = await collectTestFiles(role);
  const logLines = [];

  function log(message = '') {
    console.log(message);
    logLines.push(message);
  }

  function logError(message = '') {
    console.error(message);
    logLines.push(message);
  }

  log('\n=======================================');
  log(`  ROLE: ${role.toUpperCase()} — running ${files.length} tests`);
  log('=======================================\n');
  log(`🚀 Running ${files.length} tests against stage "${stage}" as ${role} (skipping: ${SKIP.join(', ')})...\n`);

  const shared = files.filter(file => EXCLUSIVE.includes(basename(file)));
  const parallel = files.filter(file => !EXCLUSIVE.includes(basename(file)));

  const startTime = Date.now();
  const run = file => runTestFile(file, stage, role, envFile);

  // Batched first, then the phone-sharing tests alone so they never
  const results = [
    ...await runInBatches(parallel, CONCURRENCY, run),
    ...await runInBatches(shared, 1, run)
  ];
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  log(`\n----- RESULTS (${role}) -----\n`);

  let hasErrors = false;
  results.forEach(({ file, code, stdout, stderr, duration }) => {
    const status = code === 0 ? '✅ PASSED' : '❌ FAILED';
    if (code !== 0) {
      hasErrors = true;
    }
    log(`[${status}] [${role}] ${file} - Duration: ${duration}s`);

    if (code !== 0) {
      log(`\n--- Output for ${file} as ${role} (Exit Code: ${code}) ---`);
      if (stdout.trim()) {
        log(stdout.trim());
      }
      if (stderr.trim()) {
        logError(stderr.trim());
      }
      log('--------------------------------------------\n');
    }
  });

  log(`\n⏱️ Role "${role}" total time: ${totalDuration}s`);

  // Save per-role log inside the shared timestamped run folder
  try {
    await mkdir(runLogsDir, { recursive: true });
    const logFileName = role === 'user' ? 'users.log' : `${role}.log`;
    const logFilePath = join(runLogsDir, logFileName);
    await writeFile(logFilePath, logLines.join('\n'), 'utf8');
    console.log(`\n💾 Log saved to: ${relative(testingDir, logFilePath)}`);
  } catch (err) {
    console.error(`\n⚠️ Failed to save log file: ${err.message}`);
  }

  return !hasErrors;
}

// Run the suite once per role; resolves true if every role passed
export async function runAllTests(stage, roles = ROLES) {
  const envFile = join(repoRoot, `.env.${stage}`);
  if (!existsSync(envFile)) {
    console.error(`❌ Missing ${envFile} — cannot run tests for stage "${stage}"`);
    return false;
  }

  const invalidRole = roles.find(role => !ROLES.includes(role));
  if (invalidRole) {
    console.error(`❌ Unknown role "${invalidRole}" - expected one of: ${ROLES.join(', ')}`);
    return false;
  }

  // One timestamped folder per run, shared by every role's log file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runLogsDir = join(testingDir, 'logs', timestamp);

  // Roles run sequentially to keep logs clean and dev write pressure unchanged
  const summary = [];
  for (const role of roles) {
    const passed = await runRoleTests(stage, role, envFile, runLogsDir);
    summary.push({ role, passed });
  }

  console.log('\n=======================================');
  console.log('           COMBINED SUMMARY            ');
  console.log('=======================================');
  summary.forEach(({ role, passed }) => {
    console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}  ${role}`);
  });
  console.log('=======================================\n');

  return summary.every(({ passed }) => passed);
}

// Execute if run directly: STAGE picks the stage; --role/TEST_ROLE narrows
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const stage = process.env.STAGE || 'dev';

  let roles = ROLES;
  const roleFlagIndex = process.argv.indexOf('--role');
  if (roleFlagIndex !== -1 && process.argv[roleFlagIndex + 1]) {
    roles = [process.argv[roleFlagIndex + 1]];
  } else if (process.env.TEST_ROLE) {
    roles = [process.env.TEST_ROLE];
  }

  runAllTests(stage, roles).then((passed) => {
    if (passed) {
      console.log('\n✨ All tests passed successfully!');
      process.exit(0);
    } else {
      console.error('\n❌ Some tests failed.');
      process.exit(1);
    }
  });
}
