import assert from 'node:assert/strict';
import test from 'node:test';
import {
    completeAssignmentQuiz,
    persistCompletedQuiz
} from '../../../../src/features/content/model/quizSubmissionUseCases.ts';
import type { Answer, Quiz } from '../../../../src/types/quiz.ts';

const buildAnswer = (overrides: Partial<Answer> = {}): Answer => ({
    questionId: 'q1',
    selectedOption: 'A',
    isCorrect: true,
    timeSpent: 10,
    questionNumber: 1,
    correctOption: 'A',
    questionImage: '',
    isTimeout: false,
    solutionVideo: null,
    timestamp: '2026-03-12T10:00:00.000Z',
    options: [],
    ...overrides
});

const buildQuiz = (overrides: Partial<Quiz> = {}): Quiz => ({
    id: 'quiz-1',
    title: 'Quiz',
    description: 'Aciklama',
    questions: [
        {
            id: 'q1',
            question: 'Soru',
            options: [],
            correctOptionId: 'A',
            points: 10
        }
    ],
    status: 'active',
    created_by: 'teacher-1',
    is_active: true,
    ...overrides
});

test('persistCompletedQuiz stores standard quiz results in quiz_results', async () => {
    let createQuizResultCalled = false;

    const summary = await persistCompletedQuiz(
        {
            quiz: buildQuiz(),
            answers: [buildAnswer()],
            userId: 'user-1'
        },
        {
            createQuizResult: async (input) => {
                createQuizResultCalled = true;
                assert.equal(input.quiz_id, 'quiz-1');
                assert.equal(input.correct_answers, 1);
            },
            createAssignmentResult: async () => {
                throw new Error('should not be called');
            }
        }
    );

    assert.equal(createQuizResultCalled, true);
    assert.deepEqual(summary, { score: 1, totalQuestions: 1 });
});

test('persistCompletedQuiz stores assignment results with duration minutes', async () => {
    let createAssignmentResultCalled = false;

    const summary = await persistCompletedQuiz(
        {
            quiz: buildQuiz({ isAssignment: true, id: 'assignment-1' }),
            answers: [
                buildAnswer({ timestamp: '2026-03-12T10:00:00.000Z' }),
                buildAnswer({
                    questionId: 'q2',
                    questionNumber: 2,
                    isCorrect: false,
                    timestamp: '2026-03-12T10:03:00.000Z'
                })
            ],
            userId: 'student-1'
        },
        {
            createQuizResult: async () => {
                throw new Error('should not be called');
            },
            createAssignmentResult: async (input) => {
                createAssignmentResultCalled = true;
                assert.equal(input.assignment_id, 'assignment-1');
                assert.equal(input.student_id, 'student-1');
                assert.equal(input.duration_minutes, 3);
                assert.equal(input.status, 'completed');
            }
        }
    );

    assert.equal(createAssignmentResultCalled, true);
    assert.deepEqual(summary, { score: 1, totalQuestions: 1 });
});

test('completeAssignmentQuiz stores result and marks assignment completed', async () => {
    const calls: string[] = [];

    await completeAssignmentQuiz(
        {
            assignmentId: 'assignment-5',
            answers: [buildAnswer()],
            userId: 'student-4',
            score: 7,
            totalQuestions: 10,
            startTime: new Date('2026-03-12T10:00:00.000Z')
        },
        {
            createAssignmentResult: async (input) => {
                calls.push(`result:${input.assignment_id}:${input.student_id}`);
                assert.equal(input.score, 7);
                assert.equal(input.total_questions, 10);
            },
            markAssignmentCompleted: async (assignmentId) => {
                calls.push(`complete:${assignmentId}`);
            }
        }
    );

    assert.deepEqual(calls, [
        'result:assignment-5:student-4',
        'complete:assignment-5'
    ]);
});
