import assert from 'node:assert/strict';
import test from 'node:test';
import {
    filterAdminUsers,
    formatYetenekAlani,
    parseYetenekAlani
} from '../../../../src/features/admin/model/userManagementUseCases.ts';

test('parseYetenekAlani handles array, JSON string and plain string', () => {
    assert.deepEqual(parseYetenekAlani(['resim', 'müzik']), ['resim', 'müzik']);
    assert.deepEqual(parseYetenekAlani('["genel yetenek","resim"]'), ['genel yetenek', 'resim']);
    assert.deepEqual(parseYetenekAlani('müzik'), ['müzik']);
    assert.deepEqual(parseYetenekAlani(null), []);
});

test('formatYetenekAlani returns null for empty lists', () => {
    assert.equal(formatYetenekAlani([]), null);
    assert.deepEqual(formatYetenekAlani(['resim']), ['resim']);
});

test('filterAdminUsers filters by name, email, grade, vip and talent', () => {
    const users = [
        {
            name: 'Ada',
            email: 'ada@example.com',
            grade: 3,
            is_vip: true,
            yetenek_alani: ['resim']
        },
        {
            name: 'Bora',
            email: 'bora@example.com',
            grade: '2',
            is_vip: false,
            yetenek_alani: '["müzik"]'
        }
    ];

    const filtered = filterAdminUsers(users, {
        name: 'ada',
        email: '',
        grade: '3',
        showOnlyVip: true,
        yetenek_alani: 'resim'
    });

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].name, 'Ada');
});
