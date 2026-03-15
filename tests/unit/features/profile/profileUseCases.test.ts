import assert from 'node:assert/strict';
import test from 'node:test';
import { updateEditableProfile } from '../../../../src/features/profile/model/profileUseCases.ts';

test('updateEditableProfile returns false when there is no active session user', async () => {
    let repositoryCalled = false;

    const result = await updateEditableProfile(
        {
            name: 'Ada',
            school: 'Bilsem',
            avatar_url: 'https://example.com/avatar.png'
        },
        {
            auth: {
                getSessionUser: async () => null
            },
            profile: {
                updateEditableProfile: async () => {
                    repositoryCalled = true;
                }
            }
        }
    );

    assert.equal(result, false);
    assert.equal(repositoryCalled, false);
});

test('updateEditableProfile forwards the session user id and payload to the repository', async () => {
    let receivedUserId = '';
    let receivedPayload: { name: string; school: string; avatar_url?: string } | null = null;

    const result = await updateEditableProfile(
        {
            name: 'Ada Lovelace',
            school: 'Ankara Bilsem',
            avatar_url: 'https://example.com/ada.png'
        },
        {
            auth: {
                getSessionUser: async () => ({ id: 'user-42' }) as never
            },
            profile: {
                updateEditableProfile: async (userId, input) => {
                    receivedUserId = userId;
                    receivedPayload = input;
                }
            }
        }
    );

    assert.equal(result, true);
    assert.equal(receivedUserId, 'user-42');
    assert.deepEqual(receivedPayload, {
        name: 'Ada Lovelace',
        school: 'Ankara Bilsem',
        avatar_url: 'https://example.com/ada.png'
    });
});
