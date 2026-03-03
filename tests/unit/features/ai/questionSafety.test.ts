import assert from 'node:assert/strict';
import test from 'node:test';
import { isQuestionSafe, sanitizeQuestion } from '../../../../src/features/ai/quality-safety/model/questionSafety.ts';
import type { AdaptiveQuestion } from '../../../../src/features/ai/model/types.ts';

const sampleQuestion: AdaptiveQuestion = {
    id: 'q-1',
    topic: 'mantik',
    stem: 'Diziyi tamamla: 2, 4, 6, ?',
    options: ['7', '8', '9', '10'],
    correctIndex: 1,
    explanation: 'Dizi ikişer artar.',
    difficultyLevel: 2,
    source: 'fallback'
};

test('isQuestionSafe returns true for valid question', () => {
    assert.equal(isQuestionSafe(sampleQuestion), true);
});

test('isQuestionSafe rejects duplicate options', () => {
    const invalid: AdaptiveQuestion = {
        ...sampleQuestion,
        options: ['7', '8', '8', '10']
    };

    assert.equal(isQuestionSafe(invalid), false);
});

test('sanitizeQuestion trims values and normalizes difficulty', () => {
    const sanitized = sanitizeQuestion({
        ...sampleQuestion,
        stem: '  Test sorusu  ',
        options: [' A ', ' B ', ' C ', ' D '],
        explanation: '  Açıklama  ',
        difficultyLevel: 8
    });

    assert.equal(sanitized.stem, 'Test sorusu');
    assert.deepEqual(sanitized.options, ['A', 'B', 'C', 'D']);
    assert.equal(sanitized.explanation, 'Açıklama');
    assert.equal(sanitized.difficultyLevel, 5);
});
