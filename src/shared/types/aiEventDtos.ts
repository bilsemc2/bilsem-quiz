export type AbilityDimension =
    | 'memory'
    | 'logic'
    | 'attention'
    | 'verbal'
    | 'spatial'
    | 'processing_speed';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type LearningLocale = 'tr' | 'en';

export type QuestionAttemptSource = 'ai' | 'fallback' | 'bank';

export type AdaptiveDifficultyHybridMode = 'rule_only' | 'hybrid_ai' | 'rule_fallback';

export interface AbilitySnapshotDTO {
    userId: string;
    overallScore: number;
    dimensions: Record<AbilityDimension, number>;
    updatedAtISO: string;
}

export interface SessionPerformanceMetricsDTO {
    recentAccuracy: number;
    averageResponseMs: number;
    targetResponseMs: number;
    streakCorrect: number;
    consecutiveWrong: number;
}

export interface AdaptiveDifficultyDecisionDTO {
    difficultyLevel: DifficultyLevel;
    rawDifficultyLevel: DifficultyLevel;
    baseDifficulty: DifficultyLevel;
    accuracyAdjustment: number;
    speedAdjustment: number;
    trendAdjustment: number;
    previousDifficultyLevel: DifficultyLevel | null;
    aiSuggestedDifficultyLevel: DifficultyLevel | null;
    hybridMode: AdaptiveDifficultyHybridMode;
    overallScore: number;
    recentAccuracy: number;
    averageResponseMs: number;
    targetResponseMs: number;
    streakCorrect: number;
    consecutiveWrong: number;
    adaptiveEnabled: boolean;
    maxStepDelta: number;
    reasonCodes: string[];
    explanation: string;
}

export interface SessionPerformanceDTO {
    userId: string;
    topic: string;
    locale: LearningLocale;
    metrics: SessionPerformanceMetricsDTO;
    totalQuestions: number;
    correctAnswers: number;
    startedAtISO: string;
    endedAtISO?: string | null;
    metadata?: Record<string, unknown>;
}

export interface QuestionAttemptDTO {
    userId: string;
    sessionPerformanceId: string;
    questionId: string;
    topic: string;
    difficultyLevel: DifficultyLevel;
    wasCorrect: boolean;
    responseMs: number;
    selectedIndex?: number | null;
    correctIndex?: number | null;
    source?: QuestionAttemptSource;
    questionPayload?: Record<string, unknown>;
}
