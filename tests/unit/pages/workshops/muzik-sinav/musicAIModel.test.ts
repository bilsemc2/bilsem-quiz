import assert from 'node:assert/strict';
import test from 'node:test';
import {
    advanceAdaptiveDifficulty,
    appendRecentMusicNotes,
    MAX_RECENT_MUSIC_AI_NOTES
} from '../../../../../src/pages/workshops/muzik-sinav/features/musicAI/model/musicAIModel.ts';

test('appendRecentMusicNotes keeps only the most recent note window', () => {
    const previous = Array.from({ length: MAX_RECENT_MUSIC_AI_NOTES }, (_, index) => `N${index}`);
    const result = appendRecentMusicNotes(previous, ['A', 'B']);

    assert.equal(result.length, MAX_RECENT_MUSIC_AI_NOTES);
    assert.deepEqual(result.slice(-2), ['A', 'B']);
});

test('advanceAdaptiveDifficulty increases after two consecutive correct answers', () => {
    const afterFirst = advanceAdaptiveDifficulty({
        difficulty: 2,
        streak: { correct: 0, wrong: 0 }
    }, true);

    const afterSecond = advanceAdaptiveDifficulty(afterFirst, true);

    assert.deepEqual(afterSecond, {
        difficulty: 3,
        streak: { correct: 0, wrong: 0 }
    });
});

test('advanceAdaptiveDifficulty decreases after two consecutive wrong answers', () => {
    const afterFirst = advanceAdaptiveDifficulty({
        difficulty: 3,
        streak: { correct: 0, wrong: 0 }
    }, false);

    const afterSecond = advanceAdaptiveDifficulty(afterFirst, false);

    assert.deepEqual(afterSecond, {
        difficulty: 2,
        streak: { correct: 0, wrong: 0 }
    });
});
