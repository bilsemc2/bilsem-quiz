import { spawnSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const runScript = (scriptName) => {
  const result = spawnSync(npmCommand, ['run', scriptName], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
};

const anonStatus = runScript('test:e2e:anon');

if (anonStatus !== 0) {
  process.exit(anonStatus);
}

const authStatus = runScript('test:e2e:auth');
process.exit(authStatus);
