import assert from 'node:assert/strict';
import test from 'node:test';
import {
    applyPackageDefaults,
    attachUsersToSubscriptions,
    toSubscriptionMutationInput,
    toSubscriptionUserOptions
} from '../../../../src/features/admin/model/subscriptionManagementUseCases.ts';

test('toSubscriptionUserOptions normalizes nullable values', () => {
    const users = toSubscriptionUserOptions([
        {
            id: 'u1',
            name: null,
            email: null,
            grade: null,
            is_vip: null,
            yetenek_alani: null
        }
    ]);

    assert.equal(users[0].name, 'İsimsiz Kullanıcı');
    assert.equal(users[0].email, '-');
});

test('attachUsersToSubscriptions binds user objects by user_id', () => {
    const subscriptions = attachUsersToSubscriptions(
        [
            {
                id: 's1',
                user_id: 'u1',
                package_id: 'p1',
                status: 'pending',
                credits_remaining: null,
                xp_remaining: null,
                expires_at: null,
                payment_reference: null,
                notes: null,
                created_at: '2026-03-02T10:00:00.000Z',
                activated_at: null,
                created_by: null
            }
        ],
        [{ id: 'u1', name: 'Ada', email: 'ada@example.com' }]
    );

    assert.equal(subscriptions[0].user?.name, 'Ada');
    assert.equal(subscriptions[0].user?.email, 'ada@example.com');
});

test('toSubscriptionMutationInput maps active status and optional values', () => {
    const payload = toSubscriptionMutationInput({
        user_id: 'u1',
        package_id: 'p1',
        status: 'active',
        credits_remaining: 0,
        xp_remaining: 0,
        expires_at: '',
        payment_reference: '',
        notes: ''
    });

    assert.equal(payload.credits_remaining, null);
    assert.equal(payload.xp_remaining, null);
    assert.equal(payload.expires_at, null);
    assert.equal(typeof payload.activated_at, 'string');
});

test('applyPackageDefaults updates credits/xp/expiry based on package type', () => {
    const next = applyPackageDefaults(
        'p2',
        [
            {
                id: 'p2',
                slug: 'time',
                name: 'Time',
                description: null,
                price: 100,
                price_renewal: null,
                type: 'time_based',
                initial_credits: null,
                xp_required: null,
                features: [],
                includes: [],
                payment_url: null,
                whatsapp_url: null,
                qr_code_url: null,
                is_recommended: false,
                is_active: true,
                sort_order: 1
            }
        ],
        {
            user_id: '',
            package_id: '',
            status: 'pending',
            credits_remaining: 1,
            xp_remaining: 2,
            expires_at: '',
            payment_reference: '',
            notes: ''
        }
    );

    assert.equal(next.package_id, 'p2');
    assert.equal(next.expires_at, '2026-04-06');
});
