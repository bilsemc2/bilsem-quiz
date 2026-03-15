import assert from 'node:assert/strict';
import test from 'node:test';
import {
    persistCurrentUserPushSubscription,
    removePushSubscriptionByEndpoint,
    toPushSubscriptionInput
} from '../../../../src/features/app/model/pushNotificationUseCases.ts';

const buildPushSubscription = (
    overrides: Partial<{
        endpoint: string;
        p256dh: string;
        auth: string;
    }> = {}
): Pick<PushSubscription, 'toJSON'> => ({
    toJSON: () => ({
        endpoint: overrides.endpoint ?? 'https://example.com/subscription',
        keys: {
            p256dh: overrides.p256dh ?? 'p256dh-key',
            auth: overrides.auth ?? 'auth-key'
        }
    })
}) as PushSubscription;

test('toPushSubscriptionInput returns null when subscription data is incomplete', () => {
    const input = toPushSubscriptionInput(
        'user-1',
        buildPushSubscription({ auth: ' ' })
    );

    assert.equal(input, null);
});

test('persistCurrentUserPushSubscription forwards the current user payload to the repository', async () => {
    let receivedEndpoint = '';

    const saved = await persistCurrentUserPushSubscription(
        buildPushSubscription(),
        {
            auth: {
                getSessionUser: async () => ({ id: 'user-7' }) as never
            },
            push: {
                upsertSubscription: async (input) => {
                    receivedEndpoint = input.endpoint;
                    assert.equal(input.userId, 'user-7');
                    assert.equal(input.p256dh, 'p256dh-key');
                }
            }
        }
    );

    assert.equal(saved, true);
    assert.equal(receivedEndpoint, 'https://example.com/subscription');
});

test('persistCurrentUserPushSubscription returns false when there is no session user', async () => {
    const saved = await persistCurrentUserPushSubscription(
        buildPushSubscription(),
        {
            auth: {
                getSessionUser: async () => null
            },
            push: {
                upsertSubscription: async () => {
                    throw new Error('Should not be called');
                }
            }
        }
    );

    assert.equal(saved, false);
});

test('removePushSubscriptionByEndpoint trims the endpoint before deleting', async () => {
    let receivedEndpoint = '';

    await removePushSubscriptionByEndpoint('  https://example.com/subscription  ', {
        deleteSubscriptionByEndpoint: async (endpoint) => {
            receivedEndpoint = endpoint;
        }
    });

    assert.equal(receivedEndpoint, 'https://example.com/subscription');
});
