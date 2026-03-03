import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAdaptiveQuestionSchema } from '../../../../src/features/ai/quality-safety/model/questionSchemaValidator.ts';

test('validateAdaptiveQuestionSchema normalizes valid adaptive question', () => {
    const result = validateAdaptiveQuestionSchema({
        id: '  q-1  ',
        topic: '  mantik  ',
        stem: '  Diziyi tamamla: 2, 4, 6, ?  ',
        options: [' 7 ', ' 8 ', ' 9 ', ' 10 '],
        correctIndex: 1,
        explanation: '  Dizi ikişer artar.  ',
        difficultyLevel: 8,
        source: 'ai'
    });

    assert.equal(result.success, true);
    if (!result.success) {
        return;
    }

    assert.equal(result.value.id, 'q-1');
    assert.equal(result.value.topic, 'mantik');
    assert.equal(result.value.stem, 'Diziyi tamamla: 2, 4, 6, ?');
    assert.deepEqual(result.value.options, ['7', '8', '9', '10']);
    assert.equal(result.value.correctIndex, 1);
    assert.equal(result.value.explanation, 'Dizi ikişer artar.');
    assert.equal(result.value.difficultyLevel, 5);
    assert.equal(result.value.source, 'ai');
});

test('validateAdaptiveQuestionSchema rejects invalid shape', () => {
    const result = validateAdaptiveQuestionSchema({
        id: '',
        topic: 'mantik',
        stem: 'abc',
        options: ['A', 'B'],
        correctIndex: 6,
        explanation: 'x',
        difficultyLevel: 'high',
        source: 'model'
    });

    assert.equal(result.success, false);
    if (result.success) {
        return;
    }

    assert.ok(result.errors.length >= 5);
    assert.ok(result.errors.includes('id must be a non-empty string'));
    assert.ok(result.errors.includes('options must be a string array with exactly 4 items'));
    assert.ok(result.errors.includes('source must be "ai" or "fallback"'));
});
