import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('protectElement keeps the shared auth, access, role, and xp guard order', () => {
    const source = readFileSync(
        new URL('../../src/components/guards/protectElement.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /<AuthGuard>/);
    assert.match(source, /<RouteAccessGateProvider \{\.\.\.options\}>/);
    assert.match(source, /<RoleGuard>/);
    assert.match(source, /<XPGate>\{children\}<\/XPGate>/);
    assert.match(source, /<AuthGuard>\s*<RouteAccessGateProvider \{\.\.\.options\}>\s*<RoleGuard>\s*<XPGate>\{children\}<\/XPGate>\s*<\/RoleGuard>\s*<\/RouteAccessGateProvider>\s*<\/AuthGuard>/);
});

test('auth guard redirects anonymous users to login and preserves origin route in state', () => {
    const source = readFileSync(
        new URL('../../src/components/guards/AuthGuard.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /const \{ user, loading \} = useAuth\(\);/);
    assert.match(source, /const location = useLocation\(\);/);
    assert.match(source, /if \(!user\) \{\s*return <Navigate to="\/login" state=\{\{ from: location \}\} replace \/>;\s*\}/);
});

test('guest guard redirects authenticated users away from login and signup pages', () => {
    const source = readFileSync(
        new URL('../../src/components/guards/GuestGuard.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /const \{ user, loading \} = useAuth\(\);/);
    assert.match(source, /const location = useLocation\(\);/);
    assert.match(source, /resolvePostLoginPath\(location\.state\)/);
    assert.match(source, /if \(user\) \{\s*return <Navigate to=\{resolvePostLoginPath\(location\.state\)\} replace \/>;\s*\}/);
});

test('auth routes keep login and signup guest-only while reset-password stays public', () => {
    const source = readFileSync(
        new URL('../../src/routes/authRoutes.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /path="\/login" element=\{<GuestGuard><LoginPage \/><\/GuestGuard>\}/);
    assert.match(source, /path="\/signup" element=\{<GuestGuard><SignUpPage \/><\/GuestGuard>\}/);
    assert.match(source, /path="\/reset-password" element=\{<ResetPasswordPage \/>\}/);
    assert.doesNotMatch(source, /protectElement/);
});

test('brain trainer and arcade route registries keep gameplay routes behind protectElement', () => {
    const gameRoutesSource = readFileSync(
        new URL('../../src/routes/gameRoutes.tsx', import.meta.url),
        'utf8',
    );
    const arcadeRoutesSource = readFileSync(
        new URL('../../src/routes/arcadeRoutes.tsx', import.meta.url),
        'utf8',
    );

    assert.match(gameRoutesSource, /path="\/games\/stroop" element=\{protectElement\(<StroopGame \/>\)\}/);
    assert.match(gameRoutesSource, /path="\/games\/tepki-suresi" element=\{protectElement\(<ReactionTimeGame \/>\)\}/);
    assert.match(gameRoutesSource, /path="\/games\/labirent" element=\{protectElement\(<MazeRunnerGame \/>\)\}/);
    assert.match(gameRoutesSource, /path="\/ball-game" element=\{protectElement\(<BallGame \/>\)\}/);

    assert.match(arcadeRoutesSource, /path="\/bilsem-zeka" element=\{protectElement\(<ArcadeHubPage \/>\)\}/);
    assert.match(arcadeRoutesSource, /path="\/bilsem-zeka\/chromabreak" element=\{protectElement\(<ChromaBreak \/>\)\}/);
    assert.match(arcadeRoutesSource, /path="\/bilsem-zeka\/karanlik-labirent" element=\{protectElement\(<DarkMaze \/>\)\}/);
});

test('workshop routes preserve public landing pages while protecting assessment and exam flows', () => {
    const source = readFileSync(
        new URL('../../src/routes/workshopRoutes.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /path="\/atolyeler\/genel-yetenek" element=\{<GenelYetenekPage \/>\}/);
    assert.match(source, /path="\/atolyeler\/resim" element=\{<ResimPage \/>\}/);
    assert.match(source, /path="\/atolyeler\/muzik-sinav" element=\{<MuzikSinavRoutes \/>\}/);
    assert.match(source, /path="\/atolyeler\/tablet-degerlendirme" element=\{protectElement\(<TabletAssessmentPage \/>\)\}/);
    assert.match(source, /path="\/atolyeler\/bireysel-degerlendirme" element=\{protectElement\(<IndividualAssessmentPage \/>\)\}/);
    assert.match(source, /path="\/atolyeler\/sinav-simulasyonu" element=\{protectElement\(<ExamSimulatorPage \/>\)\}/);
    assert.match(source, /path="\/atolyeler\/sinav-simulasyonu\/devam" element=\{protectElement\(<ExamContinuePage \/>\)\}/);
    assert.match(source, /path="\/atolyeler\/sinav-simulasyonu\/sonuc" element=\{protectElement\(<ExamResultPage \/>\)\}/);
});

test('content and admin routes keep profile skipXP and admin-only protection intact', () => {
    const contentRoutesSource = readFileSync(
        new URL('../../src/routes/contentRoutes.tsx', import.meta.url),
        'utf8',
    );
    const adminRoutesSource = readFileSync(
        new URL('../../src/routes/adminRoutes.tsx', import.meta.url),
        'utf8',
    );

    assert.match(contentRoutesSource, /path="\/bilsem" element=\{<BilsemPage \/>\}/);
    assert.match(contentRoutesSource, /path="\/blog" element=\{<BlogPage \/>\}/);
    assert.match(contentRoutesSource, /path="\/deyimler" element=\{protectElement\(<DeyimlerPage \/>\)\}/);
    assert.match(contentRoutesSource, /path="\/profile" element=\{protectElement\(<ProfilePage \/>, \{ skipXPCheck: true \}\)\}/);
    assert.match(contentRoutesSource, /path="\/stories\/quiz-game" element=\{protectElement\(<StoryQuizGame \/>\)\}/);

    assert.match(adminRoutesSource, /path="\/admin\/\*" element=\{protectElement\(<AdminPage \/>, \{ requireAdmin: true \}\)\}/);
});
