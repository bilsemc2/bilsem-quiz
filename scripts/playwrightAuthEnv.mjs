const readTrimmedEnv = (env, key) => {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const hasTruthyFlag = (env, key) => readTrimmedEnv(env, key) === '1';
const EXPECTATION_FLAG_KEYS = ['E2E_EXPECT_GENERAL_TALENT', 'E2E_EXPECT_MUSIC_TALENT'];
const isAllowedExpectationFlagValue = (value) => value === '' || value === '1';

export const resolvePlaywrightAuthEnv = (env = process.env) => {
  const email = readTrimmedEnv(env, 'E2E_AUTH_EMAIL');
  const password = readTrimmedEnv(env, 'E2E_AUTH_PASSWORD');
  const expectedProfileName = readTrimmedEnv(env, 'E2E_EXPECT_PROFILE_NAME');
  const expectedReferralCode = readTrimmedEnv(env, 'E2E_EXPECT_PROFILE_REFERRAL_CODE');
  const expectsGeneralTalent = hasTruthyFlag(env, 'E2E_EXPECT_GENERAL_TALENT');
  const expectsMusicTalent = hasTruthyFlag(env, 'E2E_EXPECT_MUSIC_TALENT');
  const forceMockAuth = readTrimmedEnv(env, 'E2E_USE_MOCK_AUTH') === '1';
  const hasAnyCredentials = Boolean(email || password);
  const hasCredentials = Boolean(email && password);
  const hasPartialCredentials = hasAnyCredentials && !hasCredentials;
  const useMockAuth = forceMockAuth || !hasAnyCredentials;
  const canRunAuthenticatedFlows = hasCredentials || useMockAuth;

  return {
    email,
    password,
    expectedProfileName,
    expectedReferralCode,
    expectsGeneralTalent,
    expectsMusicTalent,
    forceMockAuth,
    hasAnyCredentials,
    hasCredentials,
    hasPartialCredentials,
    useMockAuth,
    canRunAuthenticatedFlows,
  };
};

export const validatePlaywrightAuthEnv = (env = process.env) => {
  const authEnv = resolvePlaywrightAuthEnv(env);

  if (authEnv.hasPartialCredentials && !authEnv.forceMockAuth) {
    return {
      ok: false,
      code: 'partial_credentials',
      message:
        'Partial E2E auth configuration detected. Provide both E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD, clear both, or set E2E_USE_MOCK_AUTH=1 to force mock auth.',
      authEnv,
    };
  }

  return {
    ok: true,
    code: 'ok',
    authEnv,
  };
};

export const validateStrictRealAuthEnv = (env = process.env) => {
  const authEnv = resolvePlaywrightAuthEnv(env);

  if (authEnv.forceMockAuth) {
    return {
      ok: false,
      code: 'mock_forced',
      message:
        'Strict real-auth Playwright smoke cannot run while E2E_USE_MOCK_AUTH=1. Clear that flag or set it to 0.',
      authEnv,
    };
  }

  if (authEnv.hasPartialCredentials) {
    return {
      ok: false,
      code: 'partial_credentials',
      message:
        'Strict real-auth Playwright smoke requires both E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD.',
      authEnv,
    };
  }

  if (!authEnv.hasCredentials) {
    return {
      ok: false,
      code: 'missing_credentials',
      message:
        'Set both E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run strict real-auth Playwright smoke.',
      authEnv,
    };
  }

  return {
    ok: true,
    code: 'ok',
    authEnv,
  };
};

export const validatePlaywrightCIAuthEnv = (env = process.env) => {
  const authEnv = resolvePlaywrightAuthEnv(env);
  const invalidExpectationFlag = EXPECTATION_FLAG_KEYS.find((key) => {
    const value = readTrimmedEnv(env, key);
    return !isAllowedExpectationFlagValue(value);
  });
  const hasTalentExpectations = authEnv.expectsGeneralTalent || authEnv.expectsMusicTalent;
  const hasProfileExpectations = Boolean(
    authEnv.expectedProfileName || authEnv.expectedReferralCode,
  );
  const hasRealAuthOnlyExpectations = hasTalentExpectations || hasProfileExpectations;

  if (invalidExpectationFlag) {
    return {
      ok: false,
      code: 'invalid_expectation_flag',
      message: `${invalidExpectationFlag} must be empty or set to 1.`,
      authEnv,
    };
  }

  if (authEnv.hasPartialCredentials) {
    return {
      ok: false,
      code: 'partial_credentials',
      message:
        'CI E2E auth secrets are partially configured. Provide both E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD or clear both.',
      authEnv,
    };
  }

  if (hasRealAuthOnlyExpectations && !authEnv.hasCredentials) {
    return {
      ok: false,
      code: 'orphan_expectations',
      message:
        'CI E2E expectation secrets require real auth credentials. Add both E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD or clear the expectation secrets.',
      authEnv,
    };
  }

  return {
    ok: true,
    code: authEnv.hasCredentials ? 'real_auth_configured' : 'mock_only',
    authEnv,
  };
};

export const formatPlaywrightCIAuthSummary = (validation) => {
  const modeLabel =
    validation.code === 'real_auth_configured'
      ? 'real-auth configured'
      : validation.code === 'mock_only'
        ? 'mock-only baseline'
        : `invalid (${validation.code})`;

  return [
    'Playwright CI auth preflight',
    `- mode: ${modeLabel}`,
    `- strict real-auth step: ${
      validation.ok && validation.code === 'real_auth_configured' ? 'enabled' : 'skipped'
    }`,
    `- general talent expectation: ${validation.authEnv?.expectsGeneralTalent ? 'enabled' : 'disabled'}`,
    `- music talent expectation: ${validation.authEnv?.expectsMusicTalent ? 'enabled' : 'disabled'}`,
    `- profile name expectation: ${
      validation.authEnv?.expectedProfileName ? 'configured' : 'disabled'
    }`,
    `- referral code expectation: ${
      validation.authEnv?.expectedReferralCode ? 'configured' : 'disabled'
    }`,
  ].join('\n');
};
