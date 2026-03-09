import {
    DIFFICULTY_LEVELS,
    type DifficultyConfig,
    type ExamMode,
    type ExamModule,
    type ExamResult,
    type ExamSession
} from '../../../types/examTypes.ts';

export const EXAM_SESSION_STORAGE_KEY = 'exam_session';

const DIFFICULTY_MULTIPLIERS: Record<number, number> = {
    1: 0.7,
    2: 0.85,
    3: 1.0,
    4: 1.15,
    5: 1.3
};

export interface ExamProgress {
    current: number;
    total: number;
    percentage: number;
}

export interface ExamCategoryStats {
    passed: number;
    total: number;
    percentage: number;
}

export interface ExamSessionSummary {
    passedCount: number;
    failedCount: number;
    totalScore: number;
    maxScore: number;
    scorePercentage: number;
    totalDuration: number;
    averageLevel: number;
    maxLevelReached: number;
    passRate: number;
    abilityEstimate: number;
    bzpScore: number;
    categoryStats: Record<string, ExamCategoryStats>;
}

export interface CompletedExamPersistenceInput {
    id: string;
    userId: string;
    startedAt: Date;
    completedAt: Date | null;
    moduleCount: number;
    results: ExamResult[];
    finalScore: number;
    bzpScore: number;
    abilityEstimate: string;
}

interface StoredExamSessionShape {
    id: string;
    userId: string;
    startedAt: string | Date;
    completedAt: string | Date | null;
    modules: ExamModule[];
    currentIndex: number;
    currentLevel: number;
    results: ExamResult[];
    status: ExamSession['status'];
    examMode: ExamMode;
}

interface CreateExamSessionInput {
    id: string;
    userId: string;
    mode: ExamMode;
    modules: ExamModule[];
    startedAt?: Date;
}

interface SubmitExamResultInput {
    passed: boolean;
    score: number;
    maxScore: number;
    duration: number;
    completedAt?: Date;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const toValidDate = (value: unknown): Date | null => {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
};

export const normalizeExamSession = (value: unknown): ExamSession | null => {
    if (!isObject(value) || !Array.isArray(value.modules) || !Array.isArray(value.results)) {
        return null;
    }

    if (typeof value.id !== 'string' || typeof value.userId !== 'string' || typeof value.currentIndex !== 'number' || typeof value.currentLevel !== 'number') {
        return null;
    }

    const startedAt = toValidDate(value.startedAt);
    if (!startedAt) {
        return null;
    }

    const completedAt = value.completedAt === null ? null : toValidDate(value.completedAt);
    if (value.completedAt !== null && !completedAt) {
        return null;
    }

    return {
        ...(value as unknown as StoredExamSessionShape),
        startedAt,
        completedAt
    };
};

export const readExamSessionFromStorage = (
    storage: Pick<Storage, 'getItem'>,
    storageKey = EXAM_SESSION_STORAGE_KEY
): ExamSession | null => {
    const stored = storage.getItem(storageKey);
    if (!stored) {
        return null;
    }

    try {
        return normalizeExamSession(JSON.parse(stored));
    } catch {
        return null;
    }
};

export const writeExamSessionToStorage = (
    storage: Pick<Storage, 'setItem'>,
    session: ExamSession,
    storageKey = EXAM_SESSION_STORAGE_KEY
) => {
    storage.setItem(storageKey, JSON.stringify(session));
};

export const clearExamSessionFromStorage = (
    storage: Pick<Storage, 'removeItem'>,
    storageKey = EXAM_SESSION_STORAGE_KEY
) => {
    storage.removeItem(storageKey);
};

export const createExamSession = ({
    id,
    userId,
    mode,
    modules,
    startedAt = new Date()
}: CreateExamSessionInput): ExamSession => ({
    id,
    userId,
    startedAt,
    completedAt: null,
    modules,
    currentIndex: 0,
    currentLevel: 1,
    results: [],
    status: 'active',
    examMode: mode
});

export const getCurrentExamModule = (session: ExamSession | null): ExamModule | null => {
    if (!session || session.currentIndex >= session.modules.length) {
        return null;
    }

    return session.modules[session.currentIndex];
};

export const getNextExamLevel = (session: ExamSession | null): number => session?.currentLevel ?? 1;

export const getExamProgress = (session: ExamSession | null): ExamProgress => {
    if (!session) {
        return { current: 0, total: 0, percentage: 0 };
    }

    const total = session.modules.length;
    const completedCount = Math.min(session.currentIndex, total);

    return {
        current: Math.min(session.currentIndex + 1, total),
        total,
        percentage: total > 0 ? Math.round((completedCount / total) * 100) : 0
    };
};

export const getDifficultyConfigForLevel = (level: number): DifficultyConfig => (
    DIFFICULTY_LEVELS.find((item) => item.level === level) ?? DIFFICULTY_LEVELS[2]
);

export const submitExamModuleResult = (
    session: ExamSession,
    input: SubmitExamResultInput
): ExamSession => {
    const currentModule = getCurrentExamModule(session);
    if (!currentModule) {
        return session;
    }

    const result: ExamResult = {
        moduleId: currentModule.id,
        moduleTitle: currentModule.title,
        level: session.currentLevel,
        passed: input.passed,
        score: input.score,
        maxScore: input.maxScore,
        duration: input.duration,
        category: currentModule.category
    };

    const nextIndex = session.currentIndex + 1;
    const status: ExamSession['status'] = nextIndex >= session.modules.length ? 'completed' : 'active';

    return {
        ...session,
        results: [...session.results, result],
        currentIndex: nextIndex,
        currentLevel: input.passed
            ? Math.min(5, session.currentLevel + 1)
            : Math.max(1, session.currentLevel - 1),
        status,
        completedAt: status === 'completed' ? (input.completedAt ?? new Date()) : null
    };
};

export const markExamSessionCompleted = (
    session: ExamSession,
    completedAt = new Date()
): ExamSession => {
    if (session.status === 'completed' && session.completedAt) {
        return session;
    }

    return {
        ...session,
        status: 'completed',
        completedAt: session.completedAt ?? completedAt
    };
};

export const summarizeExamSession = (session: Pick<ExamSession, 'results'>): ExamSessionSummary => {
    const { results } = session;
    const passedCount = results.filter((item) => item.passed).length;
    const failedCount = results.length - passedCount;
    const totalScore = results.reduce((sum, item) => sum + item.score, 0);
    const maxScore = results.reduce((sum, item) => sum + item.maxScore, 0);
    const totalDuration = results.reduce((sum, item) => sum + item.duration, 0);
    const averageLevel = results.length > 0
        ? results.reduce((sum, item) => sum + item.level, 0) / results.length
        : 0;
    const maxLevelReached = results.length > 0
        ? Math.max(...results.map((item) => item.level))
        : 0;
    const passRate = results.length > 0 ? passedCount / results.length : 0;
    const abilityEstimate = (passRate * 6) - 3;
    const weightedAverage = results.length > 0
        ? results
            .map((item) => {
                const baseScore = item.maxScore > 0 ? item.score / item.maxScore : 0;
                return baseScore * (DIFFICULTY_MULTIPLIERS[item.level] ?? 1.0);
            })
            .reduce((sum, item) => sum + item, 0) / results.length
        : 0;
    const categoryStats = results.reduce<Record<string, ExamCategoryStats>>((acc, item) => {
        const current = acc[item.category] ?? { passed: 0, total: 0, percentage: 0 };
        const total = current.total + 1;
        const passed = current.passed + (item.passed ? 1 : 0);

        acc[item.category] = {
            passed,
            total,
            percentage: Math.round((passed / total) * 100)
        };

        return acc;
    }, {});

    return {
        passedCount,
        failedCount,
        totalScore,
        maxScore,
        scorePercentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        totalDuration,
        averageLevel,
        maxLevelReached,
        passRate,
        abilityEstimate,
        bzpScore: Math.round(Math.max(70, Math.min(145, 100 + (weightedAverage - 0.5) * 60))),
        categoryStats
    };
};

export const buildCompletedExamPersistenceInput = (
    session: ExamSession,
    userId: string
): CompletedExamPersistenceInput => {
    const completedSession = markExamSessionCompleted(session);
    const summary = summarizeExamSession(completedSession);

    return {
        id: completedSession.id,
        userId,
        startedAt: completedSession.startedAt,
        completedAt: completedSession.completedAt,
        moduleCount: completedSession.modules.length,
        results: completedSession.results,
        finalScore: summary.scorePercentage,
        bzpScore: summary.bzpScore,
        abilityEstimate: summary.abilityEstimate.toFixed(2)
    };
};
