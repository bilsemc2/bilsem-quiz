import {
    systemStatsRepository,
    type SystemStatsQuizResultRow,
    type SystemStatsRepository,
    type SystemStatsUserProgressRow
} from '@/server/repositories/systemStatsRepository';

export interface QuizTopScorer {
    name: string;
    email: string;
    score: number;
    date: string;
}

export interface SystemQuizStats {
    totalQuizzes: number;
    averageScore: number;
    totalQuestionsAnswered: number;
    totalCorrectAnswers: number;
    accuracyRate: number;
    quizzesByDay: Record<string, number>;
    topScorers: QuizTopScorer[];
}

export interface SystemUserStats {
    totalUsers: number;
    averagePoints: number;
    totalExperience: number;
    totalPoints: number;
    accuracyRate: number;
}

export interface SystemStatsSummary {
    quizStats: SystemQuizStats;
    userStats: SystemUserStats;
}

const formatDate = (value: string): string => {
    return new Date(value).toLocaleDateString('tr-TR');
};

const getQuizProfile = (
    profile: SystemStatsQuizResultRow['profiles']
): { full_name?: string | null; email?: string | null } | null => {
    if (Array.isArray(profile)) {
        return profile[0] ?? null;
    }

    return profile ?? null;
};

const sortEntriesByDate = (entries: Array<[string, number]>) => {
    return [...entries].sort((left, right) => {
        const [leftDay, leftMonth, leftYear] = left[0].split('.').map(Number);
        const [rightDay, rightMonth, rightYear] = right[0].split('.').map(Number);
        const leftTime = new Date(leftYear, (leftMonth || 1) - 1, leftDay || 1).getTime();
        const rightTime = new Date(rightYear, (rightMonth || 1) - 1, rightDay || 1).getTime();
        return leftTime - rightTime;
    });
};

export const buildSystemQuizStats = (
    quizData: SystemStatsQuizResultRow[]
): SystemQuizStats => {
    const totalQuizzes = quizData.length;
    const totalQuestionsAnswered = quizData.reduce(
        (sum, quiz) => sum + (Number(quiz.questions_answered) || 0),
        0
    );
    const totalCorrectAnswers = quizData.reduce(
        (sum, quiz) => sum + (Number(quiz.correct_answers) || 0),
        0
    );
    const totalScore = quizData.reduce((sum, quiz) => sum + (Number(quiz.score) || 0), 0);

    const dayBuckets = quizData.reduce((acc, quiz) => {
        const date = formatDate(quiz.completed_at);
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const quizzesByDay = Object.fromEntries(sortEntriesByDate(Object.entries(dayBuckets)));

    const topScorers = quizData
        .map((quiz) => {
            const profile = getQuizProfile(quiz.profiles);

            return {
                name: profile?.full_name?.trim() || 'İsimsiz',
                email: profile?.email?.trim() || '',
                score: Number(quiz.score) || 0,
                date: formatDate(quiz.completed_at)
            };
        })
        .sort((left, right) => right.score - left.score)
        .slice(0, 5);

    return {
        totalQuizzes,
        averageScore: totalQuizzes ? totalScore / totalQuizzes : 0,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        accuracyRate: totalQuestionsAnswered
            ? (totalCorrectAnswers / totalQuestionsAnswered) * 100
            : 0,
        quizzesByDay,
        topScorers
    };
};

export const buildSystemUserStats = (
    userData: SystemStatsUserProgressRow[]
): SystemUserStats => {
    const totalPoints = userData.reduce((sum, user) => sum + (Number(user.points) || 0), 0);
    const totalExperience = userData.reduce(
        (sum, user) => sum + (Number(user.experience) || 0),
        0
    );
    const totalUsers = userData.length;

    return {
        totalUsers,
        averagePoints: totalUsers ? totalPoints / totalUsers : 0,
        totalExperience,
        totalPoints,
        accuracyRate: totalExperience ? (totalPoints / totalExperience) * 100 : 0
    };
};

export const loadSystemStatsSummary = async (
    deps: SystemStatsRepository = systemStatsRepository
): Promise<SystemStatsSummary> => {
    const [quizData, userData] = await Promise.all([
        deps.listQuizResults(),
        deps.listUserProgress()
    ]);

    return {
        quizStats: buildSystemQuizStats(quizData),
        userStats: buildSystemUserStats(userData)
    };
};
