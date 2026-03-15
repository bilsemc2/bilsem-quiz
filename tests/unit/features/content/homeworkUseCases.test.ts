import assert from 'node:assert/strict';
import test from 'node:test';
import {
    loadHomeworkQuizResults,
    loadHomeworkQuizzes,
    persistHomeworkQuizResult
} from '../../../../src/features/content/model/homeworkUseCases.ts';

test('loadHomeworkQuizzes maps assignment records into homework quizzes', async () => {
    const quizzes = await loadHomeworkQuizzes({
        listAssignments: async () => [
            {
                id: 'quiz-1',
                title: 'Matris Odevi',
                description: 'Aciklama',
                grade: 4,
                subject: 'Matematik',
                questions: [],
                is_active: true,
                created_at: '2026-03-12T08:00:00.000Z'
            }
        ]
    });

    assert.equal(quizzes.length, 1);
    assert.equal(quizzes[0].title, 'Matris Odevi');
    assert.equal(quizzes[0].grade, 4);
});

test('loadHomeworkQuizResults joins quiz results with assignment previews', async () => {
    const results = await loadHomeworkQuizResults('user-2', {
        listQuizResultsByUserId: async () => [
            {
                id: 'result-1',
                quiz_id: 'quiz-9',
                score: 90,
                correct_answers: 9,
                questions_answered: 10,
                completed_at: '2026-03-12T09:00:00.000Z'
            }
        ],
        listAssignmentsByIds: async (assignmentIds) => {
            assert.deepEqual(assignmentIds, ['quiz-9']);
            return [
                {
                    id: 'quiz-9',
                    title: 'Deneme',
                    description: 'Aciklama',
                    questions: []
                }
            ];
        }
    });

    assert.equal(results.length, 1);
    assert.equal(results[0].quiz?.title, 'Deneme');
    assert.equal(results[0].score, 90);
});

test('persistHomeworkQuizResult forwards payload to repository', async () => {
    let receivedQuizId = '';

    await persistHomeworkQuizResult(
        {
            user_id: 'user-3',
            quiz_id: 'quiz-4',
            score: 75,
            questions_answered: 8,
            correct_answers: 6,
            completed_at: '2026-03-12T10:00:00.000Z',
            user_answers: []
        },
        {
            createQuizResult: async (input) => {
                receivedQuizId = input.quiz_id;
            }
        }
    );

    assert.equal(receivedQuizId, 'quiz-4');
});
