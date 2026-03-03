export type AbilityDimension =
    | 'memory'
    | 'logic'
    | 'attention'
    | 'verbal'
    | 'spatial'
    | 'processing_speed';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface AbilitySnapshot {
    userId: string;
    overallScore: number; // 0-100
    dimensions: Record<AbilityDimension, number>; // 0-100
    updatedAtISO: string;
}

export interface SessionPerformance {
    recentAccuracy: number; // 0-1
    averageResponseMs: number;
    targetResponseMs: number;
    streakCorrect: number;
    consecutiveWrong: number;
}

export interface AdaptiveQuestion {
    id: string;
    topic: string;
    stem: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficultyLevel: DifficultyLevel;
    source: 'ai' | 'fallback';
}

export interface AdaptiveQuestionRequest {
    userId: string;
    topic: string;
    locale: 'tr' | 'en';
    abilitySnapshot: AbilitySnapshot;
    sessionPerformance: SessionPerformance;
    previousQuestionIds?: string[];
}

export interface AIQuestionProviderInput {
    topic: string;
    locale: 'tr' | 'en';
    difficultyLevel: DifficultyLevel;
    abilitySnapshot: AbilitySnapshot;
    sessionPerformance: SessionPerformance;
    previousQuestionIds: string[];
}

export interface AIQuestionProvider {
    generateQuestion: (input: AIQuestionProviderInput) => Promise<AdaptiveQuestion | null>;
}
