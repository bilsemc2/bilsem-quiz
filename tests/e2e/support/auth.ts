import { resolvePlaywrightAuthEnv } from '../../../scripts/playwrightAuthEnv.mjs';

const authEnv = resolvePlaywrightAuthEnv(process.env);

export const hasE2EAuthCredentials = authEnv.hasCredentials;
export const useE2EMockAuth = authEnv.useMockAuth;
export const canRunAuthenticatedFlows = authEnv.canRunAuthenticatedFlows;
export const isRealBackendAuthFlow = hasE2EAuthCredentials && !useE2EMockAuth;
export const e2eAuthEmail = authEnv.email || 'e2e.mock@example.com';
export const e2eAuthPassword = authEnv.password || 'mock-password';
export const authStatePath = '.playwright/.auth/user.json';
export const expectedProfileName = authEnv.expectedProfileName;
export const expectedReferralCode = authEnv.expectedReferralCode;

export const hasGeneralTalentFixture = useE2EMockAuth || process.env.E2E_EXPECT_GENERAL_TALENT === '1';
export const hasMusicTalentFixture = useE2EMockAuth || process.env.E2E_EXPECT_MUSIC_TALENT === '1';
