import assert from 'node:assert/strict';
import test from 'node:test';
import { ONLINE_THRESHOLD_MS, toOnlineUsers } from '../../../../src/features/content/model/onlinePresenceUseCases.ts';

test('toOnlineUsers marks users online within threshold', () => {
    const now = Date.parse('2026-03-02T12:00:00.000Z');
    const users = toOnlineUsers(
        [
            {
                id: 'u1',
                name: 'Ada',
                last_seen: '2026-03-02T11:57:30.000Z'
            }
        ],
        now,
        ONLINE_THRESHOLD_MS
    );

    assert.equal(users.length, 1);
    assert.equal(users[0].online, true);
});

test('toOnlineUsers marks users offline when timestamp is old or invalid', () => {
    const now = Date.parse('2026-03-02T12:00:00.000Z');
    const users = toOnlineUsers(
        [
            {
                id: 'u2',
                name: 'Bora',
                last_seen: '2026-03-02T11:40:00.000Z'
            },
            {
                id: 'u3',
                name: null,
                last_seen: 'not-a-date'
            }
        ],
        now,
        ONLINE_THRESHOLD_MS
    );

    assert.equal(users[0].online, false);
    assert.equal(users[1].online, false);
    assert.equal(users[1].name, 'İsimsiz Kullanıcı');
});
