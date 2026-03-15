import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatPlaywrightCIAuthSummary,
  resolvePlaywrightAuthEnv,
  validatePlaywrightAuthEnv,
  validatePlaywrightCIAuthEnv,
  validateStrictRealAuthEnv,
} from '../../../scripts/playwrightAuthEnv.mjs';

test('resolvePlaywrightAuthEnv defaults to mock auth when no real credentials are configured', () => {
  const authEnv = resolvePlaywrightAuthEnv({});

  assert.equal(authEnv.hasAnyCredentials, false);
  assert.equal(authEnv.hasCredentials, false);
  assert.equal(authEnv.useMockAuth, true);
  assert.equal(authEnv.canRunAuthenticatedFlows, true);
});

test('resolvePlaywrightAuthEnv uses real auth when both credentials are provided', () => {
  const authEnv = resolvePlaywrightAuthEnv({
    E2E_AUTH_EMAIL: 'ogrenci@example.com',
    E2E_AUTH_PASSWORD: 'super-secret',
  });

  assert.equal(authEnv.hasCredentials, true);
  assert.equal(authEnv.hasPartialCredentials, false);
  assert.equal(authEnv.useMockAuth, false);
  assert.equal(authEnv.canRunAuthenticatedFlows, true);
  assert.equal(authEnv.expectsGeneralTalent, false);
  assert.equal(authEnv.expectsMusicTalent, false);
});

test('validatePlaywrightAuthEnv rejects partial real-auth credentials unless mock auth is forced', () => {
  const validation = validatePlaywrightAuthEnv({
    E2E_AUTH_EMAIL: 'ogrenci@example.com',
  });

  assert.equal(validation.ok, false);
  assert.equal(validation.code, 'partial_credentials');
  assert.match(validation.message, /provide both e2e_auth_email and e2e_auth_password/i);
});

test('validatePlaywrightAuthEnv accepts partial credentials when mock auth is explicitly forced', () => {
  const validation = validatePlaywrightAuthEnv({
    E2E_AUTH_EMAIL: 'ogrenci@example.com',
    E2E_USE_MOCK_AUTH: '1',
  });

  assert.equal(validation.ok, true);
  assert.equal(validation.authEnv.forceMockAuth, true);
  assert.equal(validation.authEnv.useMockAuth, true);
  assert.equal(validation.authEnv.hasPartialCredentials, true);
});

test('validateStrictRealAuthEnv rejects strict real-auth runs while mock auth is forced', () => {
  const validation = validateStrictRealAuthEnv({
    E2E_AUTH_EMAIL: 'ogrenci@example.com',
    E2E_AUTH_PASSWORD: 'super-secret',
    E2E_USE_MOCK_AUTH: '1',
  });

  assert.equal(validation.ok, false);
  assert.equal(validation.code, 'mock_forced');
  assert.match(validation.message, /cannot run while e2e_use_mock_auth=1/i);
});

test('validatePlaywrightCIAuthEnv rejects orphan expectation secrets without real auth credentials', () => {
  const validation = validatePlaywrightCIAuthEnv({
    E2E_EXPECT_PROFILE_NAME: 'Ada Lovelace',
  });

  assert.equal(validation.ok, false);
  assert.equal(validation.code, 'orphan_expectations');
  assert.match(validation.message, /expectation secrets require real auth credentials/i);
});

test('validatePlaywrightCIAuthEnv rejects invalid talent expectation flag values', () => {
  const validation = validatePlaywrightCIAuthEnv({
    E2E_EXPECT_GENERAL_TALENT: 'true',
  });

  assert.equal(validation.ok, false);
  assert.equal(validation.code, 'invalid_expectation_flag');
  assert.match(validation.message, /must be empty or set to 1/i);
});

test('validatePlaywrightCIAuthEnv accepts full real-auth CI configuration', () => {
  const validation = validatePlaywrightCIAuthEnv({
    E2E_AUTH_EMAIL: 'ogrenci@example.com',
    E2E_AUTH_PASSWORD: 'super-secret',
    E2E_EXPECT_GENERAL_TALENT: '1',
    E2E_EXPECT_PROFILE_NAME: 'Ada Lovelace',
  });

  assert.equal(validation.ok, true);
  assert.equal(validation.code, 'real_auth_configured');
});

test('formatPlaywrightCIAuthSummary reports the active CI auth mode and expectation flags', () => {
  const validation = validatePlaywrightCIAuthEnv({
    E2E_AUTH_EMAIL: 'ogrenci@example.com',
    E2E_AUTH_PASSWORD: 'super-secret',
    E2E_EXPECT_GENERAL_TALENT: '1',
    E2E_EXPECT_PROFILE_NAME: 'Ada Lovelace',
  });

  const summary = formatPlaywrightCIAuthSummary(validation);

  assert.match(summary, /mode: real-auth configured/i);
  assert.match(summary, /strict real-auth step: enabled/i);
  assert.match(summary, /general talent expectation: enabled/i);
  assert.match(summary, /music talent expectation: disabled/i);
  assert.match(summary, /profile name expectation: configured/i);
});
