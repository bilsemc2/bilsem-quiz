import type { Answer, Quiz } from '@/types/quiz';
import {
    homeworkRepository,
    type CreateAssignmentResultInput,
    type CreateQuizResultInput,
    type HomeworkRepository
} from '@/server/repositories/homeworkRepository';

export interface CompletedQuizSummary {
    score: number;
    totalQuestions: number;
}

const calculateScore = (answers: Answer[]): number => {
    return answers.filter((answer) => answer.isCorrect).length;
};

const calculateDurationMinutes = (answers: Answer[]): number | null => {
    const startTime = answers[0]?.timestamp;
    const endTime = answers[answers.length - 1]?.timestamp;

    if (!startTime || !endTime) {
        return null;
    }

    return Math.round(
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)
    );
};

export const persistCompletedQuiz = async (
    input: {
        quiz: Quiz;
        answers: Answer[];
        userId: string;
    },
    deps: Pick<HomeworkRepository, 'createQuizResult' | 'createAssignmentResult'> = homeworkRepository
): Promise<CompletedQuizSummary> => {
    const score = calculateScore(input.answers);
    const totalQuestions = input.quiz.questions.length;
    const completedAt = new Date().toISOString();

    if (input.quiz.isAssignment) {
        const payload: CreateAssignmentResultInput = {
            assignment_id: input.quiz.id,
            student_id: input.userId,
            answers: input.answers,
            score,
            total_questions: totalQuestions,
            completed_at: completedAt,
            status: 'completed',
            duration_minutes: calculateDurationMinutes(input.answers)
        };

        await deps.createAssignmentResult(payload);
        return { score, totalQuestions };
    }

    const payload: CreateQuizResultInput = {
        quiz_id: input.quiz.id,
        user_id: input.userId,
        user_answers: input.answers,
        score,
        questions_answered: totalQuestions,
        correct_answers: score,
        completed_at: completedAt,
        title: input.quiz.title
    };

    await deps.createQuizResult(payload);
    return { score, totalQuestions };
};

export const completeAssignmentQuiz = async (
    input: {
        assignmentId: string;
        answers: Answer[];
        userId: string;
        score: number;
        totalQuestions: number;
        startTime: Date;
    },
    deps: Pick<
        HomeworkRepository,
        'createAssignmentResult' | 'markAssignmentCompleted'
    > = homeworkRepository
): Promise<void> => {
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - input.startTime.getTime()) / 1000);

    await deps.createAssignmentResult({
        assignment_id: input.assignmentId,
        student_id: input.userId,
        score: input.score,
        total_questions: input.totalQuestions,
        completed_at: endTime.toISOString(),
        duration,
        answers: input.answers
    });

    await deps.markAssignmentCompleted(input.assignmentId);
};
