import assert from 'node:assert/strict';
import test from 'node:test';
import { buildE2EMockAuthSession } from '../../../../src/features/auth/model/e2eMockAuth.ts';

test('buildE2EMockAuthSession creates a stable user and profile shell for browser auth smoke', () => {
    const session = buildE2EMockAuthSession('ada.lovelace@example.com');

    assert.equal(session.user.id, 'e2e-ada-lovelace-example-com');
    assert.equal(session.user.email, 'ada.lovelace@example.com');
    assert.equal(session.profile.id, session.user.id);
    assert.equal(session.profile.email, 'ada.lovelace@example.com');
    assert.equal(session.profile.name, 'Ada Lovelace');
    assert.equal(session.profile.experience, 500);
    assert.deepEqual(session.profile.yetenek_alani, ['genel yetenek', 'Müzik']);
    assert.match(session.profile.avatar_url ?? '', /dicebear/);
});

test('buildE2EMockAuthSession falls back to a default mock identity when email is missing', () => {
    const session = buildE2EMockAuthSession('');

    assert.equal(session.user.email, 'e2e.mock@example.com');
    assert.equal(session.user.id, 'e2e-e2e-mock-example-com');
    assert.equal(session.profile.name, 'E2e Mock');
});
