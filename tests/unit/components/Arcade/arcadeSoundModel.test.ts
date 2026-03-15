import assert from 'node:assert/strict';
import test from 'node:test';

import {
    ARCADE_SOUND_EVENT_MAP,
    ARCADE_SOUND_THROTTLE_MS,
    getArcadeSoundName,
    getArcadeSoundThrottleMs,
} from '../../../../src/components/Arcade/Shared/arcadeSoundModel.ts';

test('arcade sound model maps shared events to the common app sound catalog', () => {
    assert.equal(getArcadeSoundName('start'), 'click');
    assert.equal(getArcadeSoundName('launch'), 'slide');
    assert.equal(getArcadeSoundName('hit'), 'pop');
    assert.equal(getArcadeSoundName('success'), 'correct');
    assert.equal(getArcadeSoundName('reward'), 'shing');
    assert.equal(getArcadeSoundName('levelUp'), 'complete');
    assert.equal(getArcadeSoundName('fail'), 'incorrect');
    assert.equal(Object.keys(ARCADE_SOUND_EVENT_MAP).length, 7);
});

test('arcade sound model keeps short throttles for repeating game events', () => {
    assert.equal(getArcadeSoundThrottleMs('hit'), 90);
    assert.equal(getArcadeSoundThrottleMs('launch'), 120);
    assert.equal(getArcadeSoundThrottleMs('reward'), 220);
    assert.equal(getArcadeSoundThrottleMs('levelUp'), 280);
    assert.equal(ARCADE_SOUND_THROTTLE_MS.fail > ARCADE_SOUND_THROTTLE_MS.hit, true);
});
