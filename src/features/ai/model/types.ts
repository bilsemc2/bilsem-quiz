import type {
    AdaptiveDifficultyDecisionDTO,
    AdaptiveDifficultyHybridMode,
    AbilityDimension,
    AbilitySnapshotDTO,
    DifficultyLevel,
    LearningLocale,
    SessionPerformanceMetricsDTO
} from '../../../shared/types/aiEventDtos.ts';

export type { AbilityDimension, DifficultyLevel };
export type { AdaptiveDifficultyHybridMode };

export type AbilitySnapshot = AbilitySnapshotDTO;

export type SessionPerformance = SessionPerformanceMetricsDTO;

export type AdaptiveDifficultyDecision = AdaptiveDifficultyDecisionDTO;

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

export interface AIQuestionGenerationMetadata {
    providerName: string | null;
    modelName: string | null;
    promptVersion: string | null;
    promptProfileId: string | null;
}

export interface AIProviderUsage {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    cachedTokens: number | null;
}

export interface AdaptiveQuestionRequest {
    userId: string;
    topic: string;
    locale: LearningLocale;
    abilitySnapshot: AbilitySnapshot;
    sessionPerformance: SessionPerformance;
    previousQuestionIds?: string[];
    previousQuestionFingerprints?: string[];
}

export interface AIQuestionProviderInput {
    topic: string;
    locale: LearningLocale;
    difficultyLevel: DifficultyLevel;
    abilitySnapshot: AbilitySnapshot;
    sessionPerformance: SessionPerformance;
    previousQuestionIds: string[];
    previousQuestionFingerprints?: string[];
}

export interface AIQuestionProviderResult {
    question: AdaptiveQuestion | null;
    metadata: AIQuestionGenerationMetadata;
    suggestedDifficultyLevel?: DifficultyLevel | null;
    usage?: AIProviderUsage | null;
}

export interface AIQuestionProvider {
    generateQuestion: (input: AIQuestionProviderInput) => Promise<AIQuestionProviderResult>;
}
