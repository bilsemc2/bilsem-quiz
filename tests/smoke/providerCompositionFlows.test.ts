import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('root providers keep auth and xp state above the app shell', () => {
    const source = readFileSync(
        new URL('../../src/app/providers/RootProviders.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /<HelmetProvider>/);
    assert.match(source, /<AuthProvider>/);
    assert.match(source, /<XPProvider>\{children\}<\/XPProvider>/);
    assert.match(source, /<HelmetProvider>\s*<AuthProvider>\s*<XPProvider>\{children\}<\/XPProvider>\s*<\/AuthProvider>\s*<\/HelmetProvider>/);
});

test('auth provider wires session controller and last-seen heartbeat into auth context', () => {
    const source = readFileSync(
        new URL('../../src/contexts/AuthContext.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /const controller = useAuthSessionController\(\);/);
    assert.match(source, /useLastSeenHeartbeat\(controller\.user\?\.id\);/);
    assert.match(source, /<AuthContext\.Provider value=\{controller\}>/);
});

test('xp provider derives timed xp state from auth context and refreshes the profile on gain', () => {
    const source = readFileSync(
        new URL('../../src/contexts/XPContext.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /const \{ user, loading, refreshProfile \} = useAuth\(\);/);
    assert.match(source, /const controller = useTimedXPController\(\{/);
    assert.match(source, /userId: user\?\.id,/);
    assert.match(source, /enabled: Boolean\(user\) && !loading,/);
    assert.match(source, /onTimedXPGain: refreshProfile/);
    assert.match(source, /<XPContext\.Provider value=\{controller\}>/);
});

test('exam provider binds the active auth user to the exam session controller', () => {
    const source = readFileSync(
        new URL('../../src/contexts/ExamContext.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /const \{ user \} = useAuth\(\);/);
    assert.match(source, /const controller = useExamSessionController\(user\?\.id\);/);
    assert.match(source, /<ExamContext\.Provider value=\{controller\}>/);
});

test('app providers compose router-scoped shells around the routed app', () => {
    const source = readFileSync(
        new URL('../../src/app/providers/AppProviders.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /<ErrorBoundary>/);
    assert.match(source, /<SoundProvider>/);
    assert.match(source, /<Router>/);
    assert.match(source, /<ScrollToTop \/>/);
    assert.match(source, /<ExamProvider>/);
    assert.match(source, /<AdminMessageNotification \/>/);
    assert.match(source, /<UpdatePrompt \/>/);
    assert.match(source, /<GlobalXPTimer \/>/);
    assert.match(source, /<PushNotificationPrompt \/>/);
    assert.match(source, /<Toaster position="top-center" duration=\{4000\} richColors closeButton \/>/);
});

test('app entry keeps root providers above app providers and bootstraps theme, loader, and pwa refresh events', () => {
    const appSource = readFileSync(
        new URL('../../src/App.tsx', import.meta.url),
        'utf8',
    );
    const mainSource = readFileSync(
        new URL('../../src/main.tsx', import.meta.url),
        'utf8',
    );

    assert.match(appSource, /<AppProviders>/);
    assert.match(appSource, /<AppRouter \/>/);

    assert.match(mainSource, /applyInitialTheme\(\);/);
    assert.match(mainSource, /<RootProviders>\s*<App \/>\s*<\/RootProviders>/);
    assert.match(mainSource, /hideLoaderAfterRender\(\);/);
    assert.match(mainSource, /const updateSW = registerSW\(\{/);
    assert.match(mainSource, /window\.dispatchEvent\(\s*new CustomEvent\('pwa-refresh-available'/);
});

test('app router keeps all route registries mounted under the shared shell and falls back to home', () => {
    const source = readFileSync(
        new URL('../../src/app/router/AppRouter.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /<NavBar \/>/);
    assert.match(source, /<Footer \/>/);
    assert.match(source, /<Route path="\/" element=\{<HomePage \/>\} \/>/);
    assert.match(source, /\{authRoutes\}/);
    assert.match(source, /\{infoRoutes\}/);
    assert.match(source, /\{contentRoutes\}/);
    assert.match(source, /\{adminRoutes\}/);
    assert.match(source, /\{workshopRoutes\}/);
    assert.match(source, /\{gameRoutes\}/);
    assert.match(source, /\{arcadeRoutes\}/);
    assert.match(source, /<Route path="\*" element=\{<Navigate to="\/" \/>\} \/>/);
});
