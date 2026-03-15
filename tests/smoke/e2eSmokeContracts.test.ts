import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readText = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

test('package scripts expose the expected smart, mock, and strict real Playwright auth commands', () => {
  const packageJson = JSON.parse(readText('../../package.json')) as {
    scripts?: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts?.['test:e2e:auth'],
    'node scripts/run-playwright-auth.mjs',
  );
  assert.equal(
    packageJson.scripts?.['test:e2e:auth:mock'],
    'node scripts/run-playwright-mock-auth.mjs',
  );
  assert.equal(
    packageJson.scripts?.['test:e2e:auth:real'],
    'node scripts/run-playwright-real-auth.mjs',
  );
  assert.equal(
    packageJson.scripts?.['test:e2e:ci:validate'],
    'node scripts/validate-playwright-ci-auth.mjs',
  );
  assert.equal(
    packageJson.scripts?.['test:e2e:smoke'],
    'node scripts/run-playwright-smoke.mjs',
  );
});

test('playwright auth wrapper scripts preserve mock baseline, smart local auth, and strict real-auth entry points', () => {
  const smokeSource = readText('../../scripts/run-playwright-smoke.mjs');
  const mockSource = readText('../../scripts/run-playwright-mock-auth.mjs');
  const realSource = readText('../../scripts/run-playwright-real-auth.mjs');
  const ciValidateSource = readText('../../scripts/validate-playwright-ci-auth.mjs');

  assert.match(smokeSource, /runScript\('test:e2e:anon'\)/);
  assert.match(smokeSource, /runScript\('test:e2e:auth'\)/);

  assert.match(mockSource, /E2E_USE_MOCK_AUTH: '1'/);
  assert.match(mockSource, /\['run', 'test:e2e:auth:base'\]/);
  assert.match(
    mockSource,
    /Running authenticated Playwright smoke with built-in mock auth\./,
  );

  assert.match(realSource, /E2E_USE_MOCK_AUTH: '0'/);
  assert.match(realSource, /\['run', 'test:e2e:auth:base'\]/);
  assert.match(
    realSource,
    /Running authenticated Playwright smoke with strict real auth\./,
  );

  assert.match(
    ciValidateSource,
    /validatePlaywrightCIAuthEnv\(process\.env\)/,
  );
  assert.match(
    ciValidateSource,
    /formatPlaywrightCIAuthSummary\(validation\)/,
  );
});

test('ci workflow keeps mock auth as the baseline browser smoke and gates strict real-auth on complete secrets', () => {
  const workflowSource = readText('../../.github/workflows/ci.yml');

  assert.match(workflowSource, /name: Validate Playwright CI Auth Secrets/);
  assert.match(workflowSource, /run: npm run test:e2e:ci:validate/);
  assert.match(
    workflowSource,
    /HAS_REAL_E2E_AUTH:\s*\$\{\{\s*secrets\.E2E_AUTH_EMAIL != '' && secrets\.E2E_AUTH_PASSWORD != ''\s*\}\}/,
  );
  assert.match(workflowSource, /name: Browser E2E Smoke \(Auth Mock Baseline\)/);
  assert.match(workflowSource, /E2E_USE_MOCK_AUTH: '1'/);
  assert.match(workflowSource, /run: npm run test:e2e:auth:mock/);
  assert.match(workflowSource, /name: Browser E2E Smoke \(Auth Real Backend\)/);
  assert.match(workflowSource, /if: env\.HAS_REAL_E2E_AUTH == 'true'/);
  assert.match(workflowSource, /run: npm run test:e2e:auth:real/);
});
