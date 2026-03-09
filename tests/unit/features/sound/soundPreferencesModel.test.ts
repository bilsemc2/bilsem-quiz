import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createSoundPreferences,
    readSoundPreferences,
    writeSoundPreferences
} from '../../../../src/features/sound/model/soundPreferencesModel.ts';

const createStorageMock = () => {
    const store = new Map<string, string>();

    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
            store.set(key, value);
        }
    };
};

test('createSoundPreferences clamps invalid volume and parses muted flag', () => {
    assert.deepEqual(createSoundPreferences({
        storedVolume: '150',
        storedMuted: 'true'
    }), {
        volume: 100,
        isMuted: true
    });
});

test('sound preference storage helpers persist and restore normalized values', () => {
    const storage = createStorageMock();

    writeSoundPreferences(storage, {
        volume: -12,
        isMuted: false
    });

    assert.deepEqual(readSoundPreferences(storage), {
        volume: 0,
        isMuted: false
    });
});
