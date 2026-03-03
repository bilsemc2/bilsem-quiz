import assert from 'node:assert/strict';
import test from 'node:test';
import {
    filterRecipientsByTalent,
    mergeRecipientIds,
    selectAllRecipientIds,
    toMessageRecipientItems,
    toUserMessageItems
} from '../../../../src/features/content/model/adminMessagingUseCases.ts';

test('toUserMessageItems maps sender name fallback and read status', () => {
    const items = toUserMessageItems([
        {
            id: 'm1',
            message: 'Duyuru',
            sender_id: 's1',
            receiver_id: 'u1',
            created_at: '2026-03-02T12:00:00.000Z',
            read: false,
            sender: { name: 'Admin' }
        },
        {
            id: 'm2',
            message: 'Bilgi',
            sender_id: 's2',
            receiver_id: 'u1',
            created_at: '2026-03-02T13:00:00.000Z',
            read: true,
            sender: null
        }
    ]);

    assert.equal(items.length, 2);
    assert.equal(items[0].senderName, 'Admin');
    assert.equal(items[1].senderName, 'Admin');
    assert.equal(items[0].read, false);
    assert.equal(items[1].read, true);
});

test('recipient helpers normalize talents and merge selected ids', () => {
    const recipients = toMessageRecipientItems([
        {
            id: 'u1',
            name: 'Ada',
            email: 'ada@example.com',
            grade: 3,
            is_vip: true,
            yetenek_alani: ['Müzik', 'Resim']
        },
        {
            id: 'u2',
            name: null,
            email: null,
            grade: 2,
            is_vip: false,
            yetenek_alani: 'genel yetenek, resim'
        }
    ]);

    const musicRecipients = filterRecipientsByTalent(recipients, 'müzik');
    const selected = mergeRecipientIds(['u0', 'u1'], selectAllRecipientIds(recipients));

    assert.equal(recipients[1].name, 'İsimsiz Kullanıcı');
    assert.equal(recipients[1].email, '');
    assert.deepEqual(musicRecipients.map((recipient) => recipient.id), ['u1']);
    assert.deepEqual(selected, ['u0', 'u1', 'u2']);
});
