import {
    type CreateQuizResultInput,
    homeworkRepository,
    type HomeworkAssignmentPreviewRecord,
    type HomeworkAssignmentRecord,
    type HomeworkQuizQuestionRecord,
    type HomeworkQuizResultRecord,
    type HomeworkRepository
} from '@/server/repositories/homeworkRepository';

export interface HomeworkQuiz {
    id: string;
    title: string;
    description: string;
    grade: number;
    subject: string;
    questions: HomeworkQuizQuestionRecord[];
    is_active: boolean;
    created_at: string;
}

export interface HomeworkQuizResultItem {
    id: string;
    quiz_id: string;
    score: number;
    correct_answers: number;
    questions_answered: number;
    completed_at: string;
    quiz?: HomeworkAssignmentPreviewRecord;
}

const mapHomeworkQuiz = (quiz: HomeworkAssignmentRecord): HomeworkQuiz => ({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    grade: quiz.grade,
    subject: quiz.subject,
    questions: quiz.questions,
    is_active: quiz.is_active,
    created_at: quiz.created_at
});

export const loadHomeworkQuizzes = async (
    deps: Pick<HomeworkRepository, 'listAssignments'> = homeworkRepository
): Promise<HomeworkQuiz[]> => {
    const quizzes = await deps.listAssignments();
    return quizzes.map(mapHomeworkQuiz);
};

export const loadHomeworkQuizResults = async (
    userId: string,
    deps: Pick<
        HomeworkRepository,
        'listQuizResultsByUserId' | 'listAssignmentsByIds'
    > = homeworkRepository
): Promise<HomeworkQuizResultItem[]> => {
    const results = await deps.listQuizResultsByUserId(userId);
    if (results.length === 0) {
        return [];
    }

    const assignmentIds = Array.from(new Set(results.map((result) => result.quiz_id)));
    const quizzes = await deps.listAssignmentsByIds(assignmentIds);
    const quizMap = new Map(quizzes.map((quiz) => [quiz.id, quiz]));

    return results.map((result: HomeworkQuizResultRecord) => ({
        ...result,
        quiz: quizMap.get(result.quiz_id)
    }));
};

export const persistHomeworkQuizResult = async (
    input: CreateQuizResultInput,
    deps: Pick<HomeworkRepository, 'createQuizResult'> = homeworkRepository
): Promise<void> => {
    await deps.createQuizResult(input);
};
