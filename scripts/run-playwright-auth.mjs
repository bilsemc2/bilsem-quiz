import { spawnSync } from 'node:child_process';

import { validatePlaywrightAuthEnv } from './playwrightAuthEnv.mjs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const validation = validatePlaywrightAuthEnv(process.env);

if (!validation.ok) {
  console.error(validation.message);
  process.exit(1);
}

const { authEnv } = validation;

if (authEnv.forceMockAuth && authEnv.hasPartialCredentials) {
  console.log(
    'Ignoring partial real-auth credentials because E2E_USE_MOCK_AUTH=1 forces built-in mock auth.',
  );
}

if (authEnv.useMockAuth && !authEnv.hasCredentials) {
  console.log('Running authenticated Playwright smoke with built-in mock auth.');
}

const result = spawnSync(npmCommand, ['run', 'test:e2e:auth:base'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
