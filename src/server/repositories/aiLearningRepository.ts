import { supabase } from '@/lib/supabase';
import type { AbilitySnapshot, DifficultyLevel, SessionPerformance } from '@/features/ai/model/types';

interface AbilitySnapshotDbRow {
    user_id: string;
    overall_score: number;
    memory_score: number;
    logic_score: number;
    attention_score: number;
    verbal_score: number;
    spatial_score: number;
    processing_speed_score: number;
    updated_at: string;
}

interface SessionPerformanceDbRow {
    id: string;
    recent_accuracy: number;
    average_response_ms: number;
    target_response_ms: number;
    streak_correct: number;
    consecutive_wrong: number;
}

export type QuestionAttemptSource = 'ai' | 'fallback' | 'bank';

export interface AbilitySnapshotWriteOptions {
    source?: 'rule_engine' | 'ai' | 'hybrid' | 'manual';
    modelVersion?: string;
    lastSessionId?: string | null;
    context?: Record<string, unknown>;
}

export interface CreateSessionPerformancePayload {
    userId: string;
    topic: string;
    locale: 'tr' | 'en';
    metrics: SessionPerformance;
    totalQuestions?: number;
    correctAnswers?: number;
    startedAtISO?: string;
    endedAtISO?: string | null;
    metadata?: Record<string, unknown>;
}

export interface UpdateSessionPerformancePayload {
    userId: string;
    sessionPerformanceId: string;
    metrics?: Partial<SessionPerformance>;
    totalQuestions?: number;
    correctAnswers?: number;
    endedAtISO?: string | null;
    metadata?: Record<string, unknown>;
}

export interface QuestionAttemptPayload {
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

export interface AILearningRepository {
    getAbilitySnapshot: (userId: string) => Promise<AbilitySnapshot | null>;
    upsertAbilitySnapshot: (snapshot: AbilitySnapshot, options?: AbilitySnapshotWriteOptions) => Promise<void>;
    getLatestSessionPerformance: (userId: string) => Promise<SessionPerformance | null>;
    createSessionPerformance: (payload: CreateSessionPerformancePayload) => Promise<string>;
    updateSessionPerformance: (payload: UpdateSessionPerformancePayload) => Promise<void>;
    recordQuestionAttempt: (payload: QuestionAttemptPayload) => Promise<void>;
}

const normalizeScore = (value: unknown, fallback = 0): number => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return fallback;
    }

    return numeric;
};

const mapAbilitySnapshot = (row: AbilitySnapshotDbRow): AbilitySnapshot => ({
    userId: row.user_id,
    overallScore: normalizeScore(row.overall_score, 50),
    dimensions: {
        memory: normalizeScore(row.memory_score, 50),
        logic: normalizeScore(row.logic_score, 50),
        attention: normalizeScore(row.attention_score, 50),
        verbal: normalizeScore(row.verbal_score, 50),
        spatial: normalizeScore(row.spatial_score, 50),
        processing_speed: normalizeScore(row.processing_speed_score, 50)
    },
    updatedAtISO: row.updated_at
});

const mapSessionPerformance = (row: SessionPerformanceDbRow): SessionPerformance => ({
    recentAccuracy: normalizeScore(row.recent_accuracy, 0.65),
    averageResponseMs: normalizeScore(row.average_response_ms, 4500),
    targetResponseMs: normalizeScore(row.target_response_ms, 4500),
    streakCorrect: normalizeScore(row.streak_correct, 0),
    consecutiveWrong: normalizeScore(row.consecutive_wrong, 0)
});

const getAbilitySnapshot = async (userId: string): Promise<AbilitySnapshot | null> => {
    const { data, error } = await supabase
        .from('ability_snapshot')
        .select(
            [
                'user_id',
                'overall_score',
                'memory_score',
                'logic_score',
                'attention_score',
                'verbal_score',
                'spatial_score',
                'processing_speed_score',
                'updated_at'
            ].join(', ')
        )
        .eq('user_id', userId)
        .maybeSingle();

    if (error || !data) {
        if (error) {
            console.error('ability snapshot fetch failed:', error);
        }
        return null;
    }

    return mapAbilitySnapshot(data as unknown as AbilitySnapshotDbRow);
};

const upsertAbilitySnapshot = async (
    snapshot: AbilitySnapshot,
    options: AbilitySnapshotWriteOptions = {}
): Promise<void> => {
    const payload = {
        user_id: snapshot.userId,
        overall_score: snapshot.overallScore,
        memory_score: snapshot.dimensions.memory,
        logic_score: snapshot.dimensions.logic,
        attention_score: snapshot.dimensions.attention,
        verbal_score: snapshot.dimensions.verbal,
        spatial_score: snapshot.dimensions.spatial,
        processing_speed_score: snapshot.dimensions.processing_speed,
        source: options.source ?? 'rule_engine',
        model_version: options.modelVersion ?? 'v1',
        last_session_id: options.lastSessionId ?? null,
        context: options.context ?? {}
    };

    const { error } = await supabase
        .from('ability_snapshot')
        .upsert(payload, { onConflict: 'user_id' });

    if (error) {
        throw error;
    }
};

const getLatestSessionPerformance = async (userId: string): Promise<SessionPerformance | null> => {
    const { data, error } = await supabase
        .from('session_performance')
        .select('id, recent_accuracy, average_response_ms, target_response_ms, streak_correct, consecutive_wrong')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) {
        if (error) {
            console.error('latest session performance fetch failed:', error);
        }
        return null;
    }

    return mapSessionPerformance(data as unknown as SessionPerformanceDbRow);
};

const createSessionPerformance = async (payload: CreateSessionPerformancePayload): Promise<string> => {
    const totalQuestions = payload.totalQuestions ?? 0;
    const derivedCorrectAnswers = Math.round(totalQuestions * payload.metrics.recentAccuracy);
    const correctAnswers = payload.correctAnswers ?? derivedCorrectAnswers;

    const { data, error } = await supabase
        .from('session_performance')
        .insert({
            user_id: payload.userId,
            topic: payload.topic,
            locale: payload.locale,
            total_questions: totalQuestions,
            correct_answers: Math.max(0, Math.min(correctAnswers, totalQuestions)),
            recent_accuracy: payload.metrics.recentAccuracy,
            average_response_ms: payload.metrics.averageResponseMs,
            target_response_ms: payload.metrics.targetResponseMs,
            streak_correct: payload.metrics.streakCorrect,
            consecutive_wrong: payload.metrics.consecutiveWrong,
            started_at: payload.startedAtISO ?? new Date().toISOString(),
            ended_at: payload.endedAtISO ?? null,
            metadata: payload.metadata ?? {}
        })
        .select('id')
        .single();

    if (error || !data) {
        throw error ?? new Error('Session performance insert failed');
    }

    return data.id as string;
};

const updateSessionPerformance = async (payload: UpdateSessionPerformancePayload): Promise<void> => {
    const updatePayload: Record<string, unknown> = {};

    if (typeof payload.totalQuestions === 'number') {
        updatePayload.total_questions = Math.max(0, Math.round(payload.totalQuestions));
    }

    if (typeof payload.correctAnswers === 'number') {
        updatePayload.correct_answers = Math.max(0, Math.round(payload.correctAnswers));
    }

    if (payload.metrics) {
        if (typeof payload.metrics.recentAccuracy === 'number') {
            updatePayload.recent_accuracy = payload.metrics.recentAccuracy;
        }
        if (typeof payload.metrics.averageResponseMs === 'number') {
            updatePayload.average_response_ms = payload.metrics.averageResponseMs;
        }
        if (typeof payload.metrics.targetResponseMs === 'number') {
            updatePayload.target_response_ms = payload.metrics.targetResponseMs;
        }
        if (typeof payload.metrics.streakCorrect === 'number') {
            updatePayload.streak_correct = payload.metrics.streakCorrect;
        }
        if (typeof payload.metrics.consecutiveWrong === 'number') {
            updatePayload.consecutive_wrong = payload.metrics.consecutiveWrong;
        }
    }

    if (payload.endedAtISO !== undefined) {
        updatePayload.ended_at = payload.endedAtISO;
    }

    if (payload.metadata !== undefined) {
        updatePayload.metadata = payload.metadata;
    }

    if (Object.keys(updatePayload).length === 0) {
        return;
    }

    const { error } = await supabase
        .from('session_performance')
        .update(updatePayload)
        .eq('id', payload.sessionPerformanceId)
        .eq('user_id', payload.userId);

    if (error) {
        throw error;
    }
};

const recordQuestionAttempt = async (payload: QuestionAttemptPayload): Promise<void> => {
    const { error } = await supabase
        .from('question_attempt')
        .insert({
            user_id: payload.userId,
            session_performance_id: payload.sessionPerformanceId,
            question_id: payload.questionId,
            topic: payload.topic,
            difficulty_level: payload.difficultyLevel,
            was_correct: payload.wasCorrect,
            response_ms: Math.max(0, Math.round(payload.responseMs)),
            selected_index: payload.selectedIndex ?? null,
            correct_index: payload.correctIndex ?? null,
            source: payload.source ?? 'ai',
            question_payload: payload.questionPayload ?? {}
        });

    if (error) {
        throw error;
    }
};

export const aiLearningRepository: AILearningRepository = {
    getAbilitySnapshot,
    upsertAbilitySnapshot,
    getLatestSessionPerformance,
    createSessionPerformance,
    updateSessionPerformance,
    recordQuestionAttempt
};
