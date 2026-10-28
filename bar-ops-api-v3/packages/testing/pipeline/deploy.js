// Import external framework dependencies and status codes from third party packages
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runAllTests } from './run-tests.js';
import { cleanDevTables } from './clean-dev.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..', '..');

// Run a shell command from repo root, streaming output; resolves
function run(command, args) {
  return new Promise((resolve) => {
    console.log(`\n$ ${command} ${args.join(' ')}\n`);
    const child = spawn(command, args, { cwd: repoRoot, stdio: 'inherit' });
    child.on('close', (code) => resolve(code === 0));
  });
}

function banner(text) {
  console.log('\n=======================================');
  console.log(`  ${text}`);
  console.log('=======================================');
}

// CI/CD pipeline: deploy dev -> clean dev tables -> test dev -> deploy production
async function deployPipeline() {
  const startTime = Date.now();

  banner('STEP 1/4: Deploy to dev');
  const devDeployed = await run('npx', ['sst', 'deploy', '--stage', 'dev']);
  if (!devDeployed) {
    console.error('\n❌ Dev deploy failed. Pipeline aborted — production untouched.');
    process.exit(1);
  }

  // Leftover rows (e.g. the shared test phone) make tests fail with 409
  banner('STEP 2/4: Clean dev tables');
  try {
    await cleanDevTables();
  } catch (err) {
    console.error(err);
    console.error('\n❌ Dev clean failed. Pipeline aborted — production untouched.');
    process.exit(1);
  }

  banner('STEP 3/4: Run all tests on dev (admin, manager, user)');
  const testsPassed = await runAllTests('dev');
  if (!testsPassed) {
    console.error('\n❌ Tests failed on dev. Pipeline aborted — production untouched.');
    process.exit(1);
  }

  banner('STEP 4/4: Deploy to production');
  const prodDeployed = await run('npx', ['sst', 'deploy', '--stage', 'production']);
  if (!prodDeployed) {
    console.error('\n❌ Production deploy failed.');
    process.exit(1);
  }

  const totalMinutes = ((Date.now() - startTime) / 60000).toFixed(1);
  banner('PIPELINE COMPLETE');
  console.log(`\n✨ Dev deployed, all tests passed, production deployed. Total: ${totalMinutes}min`);
  process.exit(0);
}

deployPipeline();
