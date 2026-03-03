import assert from 'node:assert/strict';
import test from 'node:test';
import { applyNotificationBadges } from '../../../../src/features/admin/model/adminPageUseCases.ts';

test('applyNotificationBadges sets badge counts by menu item id', () => {
    const menu = [
        { id: 'users', title: 'Users' },
        { id: 'messages', title: 'Messages' },
        { id: 'dashboard', title: 'Dashboard' }
    ];

    const withBadges = applyNotificationBadges(menu, [
        { type: 'messages' },
        { type: 'messages' },
        { type: 'users' }
    ]);

    assert.equal(withBadges[0].badge, 1);
    assert.equal(withBadges[1].badge, 2);
    assert.equal(withBadges[2].badge, 0);
});
