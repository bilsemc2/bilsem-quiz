import { supabase } from '@/lib/supabase';
import type {
    AdaptiveQuestion,
    AIQuestionGenerationMetadata
} from '@/features/ai/model/types';
import {
    attachGenerationMetadata,
    buildQuestionFingerprint
} from '@/features/ai/question-generation/model/generationPersistenceModel';

type QuestionLocale = 'tr' | 'en';
type AIQuestionSource = 'ai' | 'fallback' | 'bank';

interface AIQuestionRow {
    id: string;
    question_fingerprint: string;
}

export interface CreateAIGenerationJobInput {
    userId: string;
    topic: string;
    locale: QuestionLocale;
    jobType: 'story_questions' | 'adaptive_pool';
    requestedQuestionCount: number;
    requestContext?: Record<string, unknown>;
    generationMetadata?: Partial<AIQuestionGenerationMetadata> | null;
}

export interface CompleteAIGenerationJobInput {
    jobId: string;
    generatedQuestionCount: number;
    modelName?: string | null;
    responseSummary?: Record<string, unknown>;
    generationMetadata?: Partial<AIQuestionGenerationMetadata> | null;
}

export interface FailAIGenerationJobInput {
    jobId: string;
    modelName?: string | null;
    errorMessage: string;
    responseSummary?: Record<string, unknown>;
    generationMetadata?: Partial<AIQuestionGenerationMetadata> | null;
}

export interface UpsertAIQuestionsInput {
    userId: string;
    topic: string;
    locale: QuestionLocale;
    generationJobId?: string | null;
    modelName?: string | null;
    promptVersion?: string | null;
    reviewStatus?: 'candidate' | 'active' | 'rejected';
    reviewNotes?: Record<string, unknown>;
    generationMetadata?: Partial<AIQuestionGenerationMetadata> | null;
    questions: AdaptiveQuestion[];
}

export interface PersistedAIQuestionReference {
    id: string;
    fingerprint: string;
}

export interface UpdateAIQuestionReviewInput {
    userId: string;
    topic: string;
    locale: QuestionLocale;
    generationMetadata?: Partial<AIQuestionGenerationMetadata> | null;
    reviews: Array<{
        fingerprint: string;
        reviewStatus: 'candidate' | 'active' | 'rejected';
        reviewNotes: Record<string, unknown>;
    }>;
}

export interface AIGenerationRepository {
    createJob: (input: CreateAIGenerationJobInput) => Promise<string>;
    completeJob: (input: CompleteAIGenerationJobInput) => Promise<void>;
    failJob: (input: FailAIGenerationJobInput) => Promise<void>;
    upsertQuestions: (input: UpsertAIQuestionsInput) => Promise<PersistedAIQuestionReference[]>;
    updateQuestionReviews: (input: UpdateAIQuestionReviewInput) => Promise<void>;
}

const normalizeSource = (value: AdaptiveQuestion['source']): AIQuestionSource => {
    return value === 'fallback' ? 'fallback' : 'ai';
};

const createJob = async (input: CreateAIGenerationJobInput): Promise<string> => {
    const { data, error } = await supabase
        .from('ai_generation_jobs')
        .insert({
            user_id: input.userId,
            topic: input.topic,
            locale: input.locale,
            job_type: input.jobType,
            requested_question_count: input.requestedQuestionCount,
            request_context: attachGenerationMetadata(
                input.requestContext ?? {},
                input.generationMetadata
            )
        })
        .select('id')
        .single();

    if (error || !data) {
        throw error ?? new Error('ai generation job insert failed');
    }

    return data.id as string;
};

const completeJob = async (input: CompleteAIGenerationJobInput): Promise<void> => {
    const { error } = await supabase
        .from('ai_generation_jobs')
        .update({
            status: 'completed',
            generated_question_count: Math.max(0, Math.round(input.generatedQuestionCount)),
            model_name: input.generationMetadata?.modelName ?? input.modelName ?? null,
            response_summary: attachGenerationMetadata(
                input.responseSummary ?? {},
                input.generationMetadata
            ),
            completed_at: new Date().toISOString()
        })
        .eq('id', input.jobId)
        .eq('status', 'pending');

    if (error) {
        throw error;
    }
};

const failJob = async (input: FailAIGenerationJobInput): Promise<void> => {
    const { error } = await supabase
        .from('ai_generation_jobs')
        .update({
            status: 'failed',
            model_name: input.generationMetadata?.modelName ?? input.modelName ?? null,
            error_message: input.errorMessage,
            response_summary: attachGenerationMetadata(
                input.responseSummary ?? {},
                input.generationMetadata
            ),
            completed_at: new Date().toISOString()
        })
        .eq('id', input.jobId)
        .eq('status', 'pending');

    if (error) {
        throw error;
    }
};

const upsertQuestions = async (input: UpsertAIQuestionsInput): Promise<PersistedAIQuestionReference[]> => {
    if (input.questions.length === 0) {
        return [];
    }

    const rows = input.questions.map((question) => {
        const fingerprint = buildQuestionFingerprint({
            stem: question.stem,
            options: question.options
        });

        return {
            created_by: input.userId,
            topic: input.topic,
            locale: input.locale,
            external_id: question.id,
            stem: question.stem,
            options: question.options,
            correct_index: question.correctIndex,
            explanation: question.explanation,
            difficulty_level: question.difficultyLevel,
            source: normalizeSource(question.source),
            question_fingerprint: fingerprint,
            prompt_version: input.generationMetadata?.promptVersion ?? input.promptVersion ?? 'v1',
            model_name: input.generationMetadata?.modelName ?? input.modelName ?? null,
            review_status: input.reviewStatus ?? 'active',
            review_notes: attachGenerationMetadata(
                input.reviewNotes ?? {},
                input.generationMetadata
            ),
            generation_job_id: input.generationJobId ?? null,
            generation_context: attachGenerationMetadata(
                {
                    originalTopic: question.topic
                },
                input.generationMetadata
            )
        };
    });

    const { data, error } = await supabase
        .from('ai_questions')
        .upsert(rows, {
            onConflict: 'created_by,topic,locale,question_fingerprint'
        })
        .select('id, question_fingerprint');

    if (error || !data) {
        throw error ?? new Error('ai questions upsert failed');
    }

    return (data as AIQuestionRow[]).map((row) => ({
        id: row.id,
        fingerprint: row.question_fingerprint
    }));
};

const updateQuestionReviews = async (input: UpdateAIQuestionReviewInput): Promise<void> => {
    if (input.reviews.length === 0) {
        return;
    }

    await Promise.all(
        input.reviews.map(async (review) => {
            const { error } = await supabase
                .from('ai_questions')
                .update({
                    review_status: review.reviewStatus,
                    review_notes: attachGenerationMetadata(
                        review.reviewNotes,
                        input.generationMetadata
                    )
                })
                .eq('created_by', input.userId)
                .eq('topic', input.topic)
                .eq('locale', input.locale)
                .eq('question_fingerprint', review.fingerprint);

            if (error) {
                throw error;
            }
        })
    );
};

export const aiGenerationRepository: AIGenerationRepository = {
    createJob,
    completeJob,
    failJob,
    upsertQuestions,
    updateQuestionReviews
};
