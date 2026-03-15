import {
    dailyQuestionRepository,
    type DailyQuestionRecord,
    type DailyQuestionRepository
} from '@/server/repositories/dailyQuestionRepository';

export type DailyQuestion = DailyQuestionRecord;

export const getDailyQuestionSeed = (date: Date): number => {
    return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
};

export const selectDailyQuestion = (
    questions: DailyQuestion[],
    date: Date
): DailyQuestion | null => {
    if (questions.length === 0) {
        return null;
    }

    const index = getDailyQuestionSeed(date) % questions.length;
    return questions[index] ?? null;
};

export const loadDailyQuestion = async (
    date: Date = new Date(),
    deps: Pick<DailyQuestionRepository, 'listActiveQuestions'> = dailyQuestionRepository
): Promise<DailyQuestion | null> => {
    const questions = await deps.listActiveQuestions();
    return selectDailyQuestion(questions, date);
};
