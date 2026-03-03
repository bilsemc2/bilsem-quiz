import assert from 'node:assert/strict';
import test from 'node:test';
import {
    shouldShowAdminMessageNotification,
    toAdminMessageNotificationItems
} from '../../../../src/features/content/model/adminMessageNotificationUseCases.ts';

test('toAdminMessageNotificationItems maps sender fields safely', () => {
    const items = toAdminMessageNotificationItems([
        {
            id: 'm1',
            message: 'Merhaba',
            sender_id: 's1',
            receiver_id: 'r1',
            created_at: '2026-03-02T10:00:00.000Z',
            read: false,
            sender: { name: 'Öğretmen' }
        },
        {
            id: 'm2',
            message: 'Duyuru',
            sender_id: 's2',
            receiver_id: 'r1',
            created_at: '2026-03-02T11:00:00.000Z',
            read: false,
            sender: null
        }
    ]);

    assert.equal(items.length, 2);
    assert.equal(items[0].senderName, 'Öğretmen');
    assert.equal(items[1].senderName, undefined);
    assert.equal(items[1].senderId, 's2');
});

test('shouldShowAdminMessageNotification checks route and message availability', () => {
    const messages = [
        {
            id: 'm1',
            message: 'Merhaba',
            senderId: 's1',
            createdAt: '2026-03-02T10:00:00.000Z'
        }
    ];

    assert.equal(shouldShowAdminMessageNotification(messages, false), true);
    assert.equal(shouldShowAdminMessageNotification(messages, true), false);
    assert.equal(shouldShowAdminMessageNotification([], false), false);
});
