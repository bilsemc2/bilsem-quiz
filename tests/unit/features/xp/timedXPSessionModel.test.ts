import assert from 'node:assert/strict';
import test from 'node:test';
import {
    clampTimedXPSeconds,
    createTimedXPState,
    getNextTimedXPSeconds,
    readTimedXPStateFromStorage,
    shouldGrantTimedXP,
    writeTimedXPStateToStorage
} from '../../../../src/features/xp/model/timedXPSessionModel.ts';

const createStorageMock = () => {
    const store = new Map<string, string>();

    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
            store.set(key, value);
        }
    };
};

test('createTimedXPState restores saved seconds and backfills missing gain time', () => {
    const state = createTimedXPState({
        storedSecondsActive: '42',
        storedLastXPGainAt: null,
        now: 10_000
    });

    assert.deepEqual(state, {
        secondsActive: 42,
        lastXPGainAt: 10_000 - 42_000
    });
});

test('clampTimedXPSeconds keeps countdown inside 0-59 band', () => {
    assert.equal(clampTimedXPSeconds(-5), 0);
    assert.equal(clampTimedXPSeconds(12.8), 12);
    assert.equal(clampTimedXPSeconds(99), 59);
});

test('getNextTimedXPSeconds increments and wraps at the interval boundary', () => {
    assert.equal(getNextTimedXPSeconds(12), 13);
    assert.equal(getNextTimedXPSeconds(59), 0);
});

test('shouldGrantTimedXP only allows rewards after a real wrap and sufficient gap', () => {
    assert.equal(shouldGrantTimedXP({
        secondsActive: 0,
        previousSecondsActive: 59,
        lastXPGainAt: 0,
        now: 60_000
    }), true);

    assert.equal(shouldGrantTimedXP({
        secondsActive: 0,
        previousSecondsActive: 0,
        lastXPGainAt: 0,
        now: 60_000
    }), false);

    assert.equal(shouldGrantTimedXP({
        secondsActive: 0,
        previousSecondsActive: 59,
        lastXPGainAt: 40_000,
        now: 60_000
    }), false);
});

test('timed XP storage helpers persist and restore state safely', () => {
    const storage = createStorageMock();

    writeTimedXPStateToStorage(storage, {
        secondsActive: 17,
        lastXPGainAt: 123_456
    });

    assert.deepEqual(readTimedXPStateFromStorage(storage, 999_999), {
        secondsActive: 17,
        lastXPGainAt: 123_456
    });
});
