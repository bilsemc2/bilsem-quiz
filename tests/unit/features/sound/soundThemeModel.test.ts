import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getLegacySoftSoundRecipeName,
    getSoftSoundRecipeName,
    SOFT_SOUND_RECIPES,
} from '../../../../src/features/sound/model/soundThemeModel.ts';

test('app sound aliases resolve to the new soft palette', () => {
    assert.equal(getSoftSoundRecipeName('click'), 'softClick');
    assert.equal(getSoftSoundRecipeName('slide'), 'softLaunch');
    assert.equal(getSoftSoundRecipeName('pop'), 'softPop');
    assert.equal(getSoftSoundRecipeName('correct'), 'softSuccess');
    assert.equal(getSoftSoundRecipeName('incorrect'), 'softFail');
    assert.equal(getSoftSoundRecipeName('success'), 'softReward');
    assert.equal(getSoftSoundRecipeName('complete'), 'softComplete');
    assert.equal(getSoftSoundRecipeName('shing'), 'softSparkle');
    assert.equal(getSoftSoundRecipeName('detective_mystery'), 'softMystery');
});

test('legacy sound names also resolve into the same soft palette', () => {
    assert.equal(getLegacySoftSoundRecipeName('flip'), 'softClick');
    assert.equal(getLegacySoftSoundRecipeName('tick'), 'softTick');
    assert.equal(getLegacySoftSoundRecipeName('match'), 'softReward');
    assert.equal(getLegacySoftSoundRecipeName('win'), 'softComplete');
    assert.equal(getLegacySoftSoundRecipeName('time-warning'), 'softWarning');
    assert.equal(getLegacySoftSoundRecipeName('wrong'), 'softFail');
});

test('soft recipes keep a calmer envelope and richer completion cadence', () => {
    assert.equal(SOFT_SOUND_RECIPES.softClick.attackMs <= 10, true);
    assert.equal(SOFT_SOUND_RECIPES.softTick.masterGain < SOFT_SOUND_RECIPES.softClick.masterGain, true);
    assert.equal(SOFT_SOUND_RECIPES.softFail.lowpassHz < SOFT_SOUND_RECIPES.softSuccess.lowpassHz, true);
    assert.equal(SOFT_SOUND_RECIPES.softReward.echoGain! > 0, true);
    assert.equal(SOFT_SOUND_RECIPES.softMystery.lowpassHz < SOFT_SOUND_RECIPES.softSparkle.lowpassHz, true);
    assert.equal(
        SOFT_SOUND_RECIPES.softComplete.tones.length > SOFT_SOUND_RECIPES.softSuccess.tones.length,
        true,
    );
});
