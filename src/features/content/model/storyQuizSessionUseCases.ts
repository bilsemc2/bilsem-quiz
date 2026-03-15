import {
    aiLearningRepository,
    type AILearningRepository,
    type CreateSessionPerformancePayload,
    type UpdateSessionPerformancePayload,
    type AbilitySnapshotWriteOptions
} from '@/server/repositories/aiLearningRepository';
import {
    aiQuestionPoolRepository,
    type AIQuestionPoolRepository
} from '@/server/repositories/aiQuestionPoolRepository';
import type {
    AbilitySnapshotDTO as AbilitySnapshot,
    SessionPerformanceMetricsDTO as SessionPerformance,
    QuestionAttemptDTO
} from '@/shared/types/aiEventDtos';

export const loadAbilitySnapshot = async (
    userId: string,
    deps: Pick<AILearningRepository, 'getAbilitySnapshot'> = aiLearningRepository
): Promise<AbilitySnapshot | null> => {
    return deps.getAbilitySnapshot(userId);
};

export const loadLatestSessionPerformance = async (
    userId: string,
    deps: Pick<AILearningRepository, 'getLatestSessionPerformance'> = aiLearningRepository
): Promise<SessionPerformance | null> => {
    return deps.getLatestSessionPerformance(userId);
};

export const startLearningSessionRecord = async (
    payload: CreateSessionPerformancePayload,
    deps: Pick<AILearningRepository, 'createSessionPerformance'> = aiLearningRepository
): Promise<string> => {
    return deps.createSessionPerformance(payload);
};

export const finalizeLearningSessionRecord = async (
    payload: UpdateSessionPerformancePayload,
    deps: Pick<AILearningRepository, 'updateSessionPerformance'> = aiLearningRepository
): Promise<void> => {
    return deps.updateSessionPerformance(payload);
};

export const saveAbilitySnapshot = async (
    snapshot: AbilitySnapshot,
    options?: AbilitySnapshotWriteOptions,
    deps: Pick<AILearningRepository, 'upsertAbilitySnapshot'> = aiLearningRepository
): Promise<void> => {
    return deps.upsertAbilitySnapshot(snapshot, options);
};

export const recordQuestionAttempt = async (
    payload: QuestionAttemptDTO,
    deps: Pick<AILearningRepository, 'recordQuestionAttempt'> = aiLearningRepository
): Promise<void> => {
    return deps.recordQuestionAttempt(payload);
};

export const markStoryQuestionSolved = async (
    userId: string,
    questionId: string,
    deps: Pick<AIQuestionPoolRepository, 'markQuestionSolved'> = aiQuestionPoolRepository
): Promise<void> => {
    return deps.markQuestionSolved(userId, questionId);
};
