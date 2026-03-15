import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getDailyQuestionSeed,
    loadDailyQuestion,
    selectDailyQuestion
} from '../../../../src/features/content/model/dailyQuestionUseCases.ts';

const buildQuestion = (id: string, questionNumber: number) => ({
    id,
    text: `Soru ${questionNumber}`,
    question_number: questionNumber,
    correct_option_id: 'A',
    image_url: '',
    solution_video: null,
    is_active: true
});

test('getDailyQuestionSeed builds a stable seed from the calendar date', () => {
    const seed = getDailyQuestionSeed(new Date('2026-03-12T10:00:00.000Z'));
    assert.equal(seed, 20260312);
});

test('selectDailyQuestion returns a deterministic question for the given date', () => {
    const question = selectDailyQuestion(
        [
            buildQuestion('q1', 1),
            buildQuestion('q2', 2),
            buildQuestion('q3', 3)
        ],
        new Date('2026-03-12T10:00:00.000Z')
    );

    assert.equal(question?.id, 'q2');
});

test('loadDailyQuestion delegates to the repository and returns null when no question exists', async () => {
    const question = await loadDailyQuestion(new Date('2026-03-13T10:00:00.000Z'), {
        listActiveQuestions: async () => [buildQuestion('q1', 1), buildQuestion('q2', 2)]
    });

    assert.equal(question?.id, 'q2');

    const emptyQuestion = await loadDailyQuestion(new Date('2026-03-13T10:00:00.000Z'), {
        listActiveQuestions: async () => []
    });

    assert.equal(emptyQuestion, null);
});
