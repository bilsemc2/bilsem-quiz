import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('login page routes sign-in and password reset through auth use cases', () => {
    const source = readFileSync(
        new URL('../../src/pages/LoginPage.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /requestPasswordResetEmail/);
    assert.match(source, /signInUser/);
    assert.match(source, /resolvePostLoginPath/);
    assert.match(source, /await signInUser\(\{\s*email,\s*password,\s*\}\);/);
    assert.match(source, /const redirectPath = resolvePostLoginPath\(location\.state\);/);
    assert.match(source, /navigate\(redirectPath, \{ replace: true \}\);/);
    assert.match(source, /const siteUrl = import\.meta\.env\.VITE_SITE_URL \|\| window\.location\.origin;/);
    assert.match(source, /await requestPasswordResetEmail\(\{\s*email: resetEmail,\s*siteUrl,\s*\}\);/);
});

test('xp access flow checks eligibility first and only deducts once after access is granted', () => {
    const providerSource = readFileSync(
        new URL('../../src/components/guards/RouteAccessGateProvider.tsx', import.meta.url),
        'utf8',
    );
    const gateSource = readFileSync(
        new URL('../../src/components/guards/XPGate.tsx', import.meta.url),
        'utf8',
    );

    assert.match(providerSource, /checkUserAccessForPath/);
    assert.match(providerSource, /deductXPForPageVisit/);
    assert.match(providerSource, /xpDeductionAttemptedRef\.current = false;/);
    assert.match(providerSource, /if \(!hasAccess \|\| requiredXP <= 0 \|\| xpDeductionAttemptedRef\.current\) \{\s*return;\s*\}/);
    assert.match(providerSource, /xpDeductionAttemptedRef\.current = true;/);
    assert.match(providerSource, /await deductXPForPageVisit\(\{\s*pagePath: location\.pathname,\s*requiredXP\s*\}\);/);
    assert.match(providerSource, /showXPDeduct\(requiredXP, 'Oyun erişimi'\);/);

    assert.match(gateSource, /if \(loading \|\| accessDeniedReason !== null\) \{\s*return;\s*\}/);
    assert.match(gateSource, /void applyXPDeductionIfNeeded\(\);/);
    assert.match(gateSource, /if \(accessDeniedReason === 'xp'\)/);
});

test('exam flow persists local progress, saves completed sessions, and keeps routing in sync', () => {
    const controllerSource = readFileSync(
        new URL('../../src/hooks/useExamSessionController.ts', import.meta.url),
        'utf8',
    );
    const simulatorPageSource = readFileSync(
        new URL('../../src/pages/workshops/ExamSimulatorPage.tsx', import.meta.url),
        'utf8',
    );
    const resultPageSource = readFileSync(
        new URL('../../src/pages/workshops/ExamResultPage.tsx', import.meta.url),
        'utf8',
    );

    assert.match(controllerSource, /const \[session, setSession\] = useState<ExamSession \| null>\(\(\) => readStoredExamSession\(\)\);/);
    assert.match(controllerSource, /const persistedCompletedSessionsRef = useRef<Set<string>>\(new Set\(\)\);/);
    assert.match(controllerSource, /const nextSession = createExamSession\(\{[\s\S]*modules: selectRandomModules\(modeConfig\.moduleCount\)/);
    assert.match(controllerSource, /persistExamSession\(nextSession\);/);
    assert.match(controllerSource, /const updatedSession = submitExamModuleResult\(session, \{/);
    assert.match(controllerSource, /persistExamSession\(updatedSession\);/);
    assert.match(controllerSource, /const completedSession = markExamSessionCompleted\(session\);/);
    assert.match(controllerSource, /if \(persistedCompletedSessionsRef\.current\.has\(completedSession\.id\)\) \{\s*return;\s*\}/);
    assert.match(controllerSource, /await persistCompletedExamSession\(\s*buildCompletedExamPersistenceInput\(completedSession, userId\)\s*\)/);
    assert.match(controllerSource, /persistExamSession\(completedSession\);/);
    assert.match(controllerSource, /persistExamSession\(null\);/);

    assert.match(simulatorPageSource, /const handleStartExam = \(\) => \{ startExam\(selectedMode\); navigate\('\/atolyeler\/sinav-simulasyonu\/devam'\); \};/);
    assert.match(resultPageSource, /if \(session\?\.status === 'completed'\) finishExam\(\);/);
});

test('game finish flow separates exam submission from regular game persistence', () => {
    const persistenceSource = readFileSync(
        new URL('../../src/hooks/useGamePersistence.ts', import.meta.url),
        'utf8',
    );
    const engineSource = readFileSync(
        new URL('../../src/components/BrainTrainer/shared/useGameEngine.ts', import.meta.url),
        'utf8',
    );

    assert.match(persistenceSource, /import { persistGamePlay } from '@\/features\/games\/model\/gamePlayUseCases';/);
    assert.match(persistenceSource, /if \(!user\) \{\s*return false;\s*\}/);
    assert.match(persistenceSource, /const workshopType = getWorkshopType\(data\.game_id\);/);
    assert.match(persistenceSource, /const intelligenceType = getZekaTuru\(data\.game_id\);/);
    assert.match(persistenceSource, /const result = await persistGamePlay\(\{\s*userId: user\.id,\s*gameId: data\.game_id,/);

    assert.match(engineSource, /const \{ saveGamePlay \} = useGamePersistence\(\);/);
    assert.match(engineSource, /const \{ submitResult \} = useExam\(\);/);
    assert.match(engineSource, /if \(examMode\) \{[\s\S]*await submitResult\(/);
    assert.match(engineSource, /navigate\("\/atolyeler\/sinav-simulasyonu\/devam"\);/);
    assert.match(engineSource, /await saveGamePlay\(\{\s*game_id: gameId,\s*score_achieved: score,\s*duration_seconds: duration,/);
    assert.match(engineSource, /buildGamePerformanceMetadata\(getPerformanceSnapshot\?\.\(\)\)/);
});

test('navbar exposes an accessible authenticated profile menu contract', () => {
    const navBarSource = readFileSync(
        new URL('../../src/components/NavBar.tsx', import.meta.url),
        'utf8',
    );

    assert.match(navBarSource, /const dropdownId = 'profile-dropdown-panel';/);
    assert.match(navBarSource, /aria-label="Profil menüsü"/);
    assert.match(navBarSource, /aria-haspopup="menu"/);
    assert.match(navBarSource, /aria-expanded=\{isOpen\}/);
    assert.match(navBarSource, /aria-controls=\{dropdownId\}/);
    assert.match(navBarSource, /id=\{dropdownId\}/);
    assert.match(navBarSource, /role="menu"/);
    assert.match(navBarSource, /const \{ user, profile, signOut \} = useAuth\(\);/);
    assert.match(navBarSource, /await signOut\(\);/);
    assert.doesNotMatch(navBarSource, /authRepository\.signOut\(\)/);
});

test('auth and profile use cases expose a dedicated e2e mock-auth fallback path', () => {
    const authUseCasesSource = readFileSync(
        new URL('../../src/features/auth/model/authUseCases.ts', import.meta.url),
        'utf8',
    );
    const accessGateServiceSource = readFileSync(
        new URL('../../src/features/auth/model/accessGateService.ts', import.meta.url),
        'utf8',
    );
    const profileUseCasesSource = readFileSync(
        new URL('../../src/features/profile/model/profileUseCases.ts', import.meta.url),
        'utf8',
    );

    assert.match(authUseCasesSource, /isE2EMockAuthEnabled/);
    assert.match(authUseCasesSource, /readE2EMockAuthSession/);
    assert.match(authUseCasesSource, /signInWithE2EMockCredentials/);
    assert.match(authUseCasesSource, /clearE2EMockAuthSession/);

    assert.match(accessGateServiceSource, /isE2EMockAuthEnabled/);
    assert.match(accessGateServiceSource, /readE2EMockAuthSession/);
    assert.match(accessGateServiceSource, /requiredXP: 0/);

    assert.match(profileUseCasesSource, /isE2EMockAuthEnabled/);
    assert.match(profileUseCasesSource, /readE2EMockAuthSession/);
    assert.match(profileUseCasesSource, /referral_code: 'E2E-FRIEND'/);
});
