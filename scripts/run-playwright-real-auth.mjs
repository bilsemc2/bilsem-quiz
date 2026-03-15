import { spawnSync } from 'node:child_process';

import { validateStrictRealAuthEnv } from './playwrightAuthEnv.mjs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const validation = validateStrictRealAuthEnv(process.env);

if (!validation.ok) {
  console.error(validation.message);
  process.exit(1);
}

console.log('Running authenticated Playwright smoke with strict real auth.');

const result = spawnSync(npmCommand, ['run', 'test:e2e:auth:base'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    E2E_USE_MOCK_AUTH: '0',
  },
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
