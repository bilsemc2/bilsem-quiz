import assert from 'node:assert/strict';
import test from 'node:test';
import { createFallbackQuestion } from '../../../../src/features/ai/question-generation/model/fallbackQuestionFactory.ts';

test('createFallbackQuestion returns 4 options and valid correct index', () => {
    const question = createFallbackQuestion({
        topic: 'mantik',
        difficultyLevel: 3,
        locale: 'tr'
    });

    assert.equal(question.options.length, 4);
    assert.ok(question.correctIndex >= 0 && question.correctIndex < 4);
    assert.equal(question.source, 'fallback');
});

test('createFallbackQuestion maps memory topic template', () => {
    const question = createFallbackQuestion({
        topic: 'hafıza oyunu',
        difficultyLevel: 5,
        locale: 'tr'
    });

    assert.match(question.explanation.toLocaleLowerCase('tr-TR'), /chunking|bellek/);
});
