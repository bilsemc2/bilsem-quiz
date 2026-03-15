import { spawnSync } from 'node:child_process';

import { validatePlaywrightAuthEnv } from './playwrightAuthEnv.mjs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const mockEnv = {
  ...process.env,
  E2E_USE_MOCK_AUTH: '1',
};

const validation = validatePlaywrightAuthEnv(mockEnv);

if (!validation.ok) {
  console.error(validation.message);
  process.exit(1);
}

const { authEnv } = validation;

if (authEnv.hasPartialCredentials) {
  console.log(
    'Ignoring partial real-auth credentials because mock-auth mode is forced for this run.',
  );
}

console.log('Running authenticated Playwright smoke with built-in mock auth.');

const result = spawnSync(npmCommand, ['run', 'test:e2e:auth:base'], {
  stdio: 'inherit',
  env: mockEnv,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
