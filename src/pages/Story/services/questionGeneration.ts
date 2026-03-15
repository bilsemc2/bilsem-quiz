// Story GPT Service — Question generation

import { StoryTheme } from '../components/types.ts';
import { generateStoryQuestionSet } from '@/features/ai/question-generation/model/storyQuestionSetUseCase';
import {
    loadSessionAccessToken,
    loadSessionUserId
} from '@/features/auth/model/authUseCases';
import type { AIProviderUsage } from '@/features/ai/model/types';
import {
    buildQuestionGenerationResponseSummary,
    buildStoryQuestionGenerationContext,
    toSafeGenerationErrorMessage
} from '@/features/ai/question-generation/model/generationPersistenceModel';
import { normalizeProviderUsage } from '@/features/ai/question-generation/model/providerUsageModel.ts';
import { aiGenerationRepository } from '@/server/repositories/aiGenerationRepository';
import { aiQuestionPoolRepository } from '@/server/repositories/aiQuestionPoolRepository';
import { aiQuestionPoolSettingsRepository } from '@/server/repositories/aiQuestionPoolSettingsRepository';

import {
    getEdgeFunctionUrl,
    resolveTopicFromTheme,
    resolveStoryGenerationMetadata,
    toStoryQuestionFromAdaptive,
    toAdaptiveQuestion,
    annotateQuestionSource,
    mergeUniqueQuestions,
    STORY_AI_GENERATION_METADATA,
} from './gptTypes.ts';
import type { GeneratedQuestion } from './gptTypes.ts';

export async function generateQuestions(story: { title: string; content: string; theme?: StoryTheme; locale?: 'tr' | 'en'; questionCount?: number }) {
    const targetCount = Math.max(1, Math.min(20, Math.round(story.questionCount || 5)));
    const theme = story.theme || 'adventure';
    const locale = story.locale || 'tr';
    const topic = resolveTopicFromTheme(theme);

    const normalizeQuestions = (value: unknown) => {
        if (!Array.isArray(value)) return null;

        const isValid = value.every((item) => {
            if (!item || typeof item !== 'object') return false;
            const question = item as {
                id?: unknown;
                source?: unknown;
                text?: unknown;
                options?: unknown;
                correctAnswer?: unknown;
                feedback?: { correct?: unknown; incorrect?: unknown };
            };

            return (
                typeof question.text === 'string' &&
                Array.isArray(question.options) &&
                question.options.length === 4 &&
                question.options.every((option) => typeof option === 'string') &&
                typeof question.correctAnswer === 'number' &&
                question.correctAnswer >= 0 &&
                question.correctAnswer < 4 &&
                question.feedback !== undefined &&
                typeof question.feedback.correct === 'string' &&
                typeof question.feedback.incorrect === 'string'
            );
        });

        if (!isValid) {
            return null;
        }

        return (value as GeneratedQuestion[]).map((question) => ({
            ...question,
            source: question.source === 'ai' || question.source === 'fallback' || question.source === 'bank'
                ? question.source
                : undefined
        }));
    };

    const normalizeProviderUsageFromResult = (value: unknown): AIProviderUsage | null => {
        if (!value || typeof value !== 'object') {
            return null;
        }

        return normalizeProviderUsage((value as { usage?: unknown }).usage);
    };

    const getUserId = async () => loadSessionUserId();

    const loadPendingQuestionsFromDB = async (
        userId: string,
        limit: number,
        maxServedCount: number
    ): Promise<GeneratedQuestion[]> => {
        try {
            const pending = await aiQuestionPoolRepository.listPendingQuestions({
                userId,
                topic,
                locale,
                limit,
                maxServedCountBeforeRetire: maxServedCount
            });
            return pending.map(toStoryQuestionFromAdaptive);
        } catch {
            return [];
        }
    };

    const persistQuestionsToDB = async (
        userId: string | null,
        questions: GeneratedQuestion[],
        source: 'ai' | 'fallback',
        generationJobId?: string | null
    ): Promise<GeneratedQuestion[]> => {
        if (!userId || questions.length === 0) {
            return source === 'fallback' ? annotateQuestionSource(questions, source) : [];
        }

        try {
            const generationMetadata = resolveStoryGenerationMetadata(source);
            const adaptiveQuestions = annotateQuestionSource(questions, source)
                .map((question) => toAdaptiveQuestion(question, topic, source));
            const saved = await aiQuestionPoolRepository.saveGeneratedQuestions({
                userId,
                topic,
                locale,
                generationJobId: generationJobId ?? null,
                generationMetadata,
                questions: adaptiveQuestions
            });
            return saved.map(toStoryQuestionFromAdaptive);
        } catch {
            return source === 'fallback' ? annotateQuestionSource(questions, source) : [];
        }
    };

    const resolveSafeGeneratedQuestions = async (
        persistedQuestions: GeneratedQuestion[],
        userId: string | null,
        generationJobId: string | null,
        requestedCount: number
    ): Promise<GeneratedQuestion[]> => {
        if (persistedQuestions.length > 0) {
            return persistedQuestions;
        }

        const fallback = await generateFallbackQuestions(requestedCount, userId);
        const persistedFallback = await persistQuestionsToDB(userId, fallback, 'fallback', generationJobId);
        return persistedFallback.length > 0 ? persistedFallback : fallback;
    };

    const generateFallbackQuestions = async (
        requestedCount: number,
        userId: string | null
    ): Promise<GeneratedQuestion[]> => {
        if (requestedCount <= 0) {
            return [];
        }

        return generateStoryQuestionSet({
            userId: userId || 'guest-user',
            theme,
            locale,
            questionCount: requestedCount
        });
    };

    const ensureMinimumQuestionCount = async (
        existing: GeneratedQuestion[],
        userId: string | null,
        generationJobId?: string | null
    ): Promise<GeneratedQuestion[]> => {
        let merged = mergeUniqueQuestions([], existing);
        if (merged.length >= targetCount) {
            return merged.slice(0, targetCount);
        }

        let attempts = 0;
        while (merged.length < targetCount && attempts < 3) {
            const needed = targetCount - merged.length;
            const generationTarget = Math.min(20, Math.max(needed, needed * 2));
            const fallback = await generateFallbackQuestions(generationTarget, userId);
            const persistedFallback = await persistQuestionsToDB(userId, fallback, 'fallback', generationJobId);
            const source = persistedFallback.length > 0 ? persistedFallback : fallback;
            const nextMerged = mergeUniqueQuestions(merged, source);

            if (nextMerged.length === merged.length) {
                break;
            }

            merged = nextMerged;
            attempts += 1;
        }

        return merged.slice(0, targetCount);
    };

    const createGenerationJob = async (
        userId: string | null,
        requestedQuestionCount: number
    ): Promise<string | null> => {
        if (!userId) {
            return null;
        }

        try {
            return await aiGenerationRepository.createJob({
                userId,
                topic,
                locale,
                jobType: 'story_questions',
                requestedQuestionCount,
                generationMetadata: STORY_AI_GENERATION_METADATA,
                requestContext: buildStoryQuestionGenerationContext({
                    story,
                    locale,
                    requestedQuestionCount,
                    generationMetadata: STORY_AI_GENERATION_METADATA
                })
            });
        } catch {
            return null;
        }
    };

    const completeGenerationJob = async (
        jobId: string | null,
        aiQuestions: GeneratedQuestion[],
        persistedQuestionCount: number,
        cachedQuestionCount: number,
        fallbackQuestionCount: number,
        providerUsage: AIProviderUsage | null
    ): Promise<void> => {
        if (!jobId) {
            return;
        }

        try {
            const requestContext = buildStoryQuestionGenerationContext({
                story,
                locale,
                requestedQuestionCount: generationCount,
                generationMetadata: STORY_AI_GENERATION_METADATA
            });
            await aiGenerationRepository.completeJob({
                jobId,
                generatedQuestionCount: aiQuestions.length,
                modelName: STORY_AI_GENERATION_METADATA.modelName,
                generationMetadata: STORY_AI_GENERATION_METADATA,
                responseSummary: buildQuestionGenerationResponseSummary({
                    requestedQuestionCount: generationCount,
                    cachedQuestionCount,
                    aiQuestions: aiQuestions.map((question) => toAdaptiveQuestion(question, topic, 'ai')),
                    fallbackQuestionCount,
                    persistedQuestionCount,
                    requestContext,
                    providerUsage,
                    generationMetadata: STORY_AI_GENERATION_METADATA
                })
            });
        } catch { /* swallow */ }
    };

    const failGenerationJob = async (
        jobId: string | null,
        error: unknown
    ): Promise<void> => {
        if (!jobId) {
            return;
        }

        try {
            await aiGenerationRepository.failJob({
                jobId,
                modelName: STORY_AI_GENERATION_METADATA.modelName,
                generationMetadata: STORY_AI_GENERATION_METADATA,
                errorMessage: toSafeGenerationErrorMessage(error)
            });
        } catch { /* swallow */ }
    };

    const settings = await aiQuestionPoolSettingsRepository.getEffectiveSettings(topic, locale);
    const maxServedCount = settings.maxServedCount;
    const targetPoolSize = Math.max(targetCount, settings.targetPoolSize);
    const refillBatchSize = settings.refillBatchSize;
    const maxGenerationPerRequest = 20;
    let generationJobId: string | null = null;
    let generationCount = 0;

    try {
        const userId = await getUserId();
        const pendingCount = userId
            ? await aiQuestionPoolRepository.getPendingQuestionCount({
                userId,
                topic,
                locale,
                maxServedCountBeforeRetire: maxServedCount
            })
            : 0;
        const cachedQuestions = userId
            ? await loadPendingQuestionsFromDB(userId, targetCount, maxServedCount)
            : [];

        if (cachedQuestions.length >= targetCount && pendingCount >= targetPoolSize) {
            return cachedQuestions.slice(0, targetCount);
        }

        const missingCount = targetCount - cachedQuestions.length;
        const refillNeeded = Math.max(0, targetPoolSize - pendingCount);
        const refillCount = refillNeeded > 0 ? Math.max(refillNeeded, refillBatchSize) : 0;
        generationCount = Math.min(maxGenerationPerRequest, Math.max(missingCount, refillCount));

        if (generationCount <= 0) {
            return cachedQuestions.slice(0, targetCount);
        }

        generationJobId = await createGenerationJob(userId, generationCount);

        const accessToken = await loadSessionAccessToken();

        const response = await fetch(getEdgeFunctionUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                action: 'generateQuestions',
                story: {
                    ...story,
                    questionCount: generationCount
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = typeof errorData?.error === 'string'
                ? errorData.error
                : 'Gemini question generation failed';
            await failGenerationJob(generationJobId, errorMessage);
            const fallback = await generateFallbackQuestions(generationCount, userId);
            const persistedFallback = await persistQuestionsToDB(userId, fallback, 'fallback', generationJobId);
            const source = persistedFallback.length > 0 ? persistedFallback : fallback;
            return ensureMinimumQuestionCount(mergeUniqueQuestions(cachedQuestions, source), userId, generationJobId);
        }

        const data = await response.json();
        const result = data.result;
        const providerUsage = normalizeProviderUsageFromResult(result);
        const normalizedDirect = normalizeQuestions(result);
        if (normalizedDirect && normalizedDirect.length > 0) {
            const newQuestions = annotateQuestionSource(normalizedDirect.slice(0, generationCount), 'ai');
            const persisted = await persistQuestionsToDB(userId, newQuestions, 'ai', generationJobId);
            const source = await resolveSafeGeneratedQuestions(
                persisted,
                userId,
                generationJobId,
                generationCount
            );
            const mergedWithoutFallbackTopUp = mergeUniqueQuestions(cachedQuestions, source);
            const finalQuestions = await ensureMinimumQuestionCount(mergedWithoutFallbackTopUp, userId, generationJobId);
            await completeGenerationJob(
                generationJobId,
                newQuestions,
                persisted.length,
                cachedQuestions.length,
                Math.max(0, finalQuestions.length - mergedWithoutFallbackTopUp.length),
                providerUsage
            );
            return finalQuestions;
        }

        const normalizedNested = normalizeQuestions((result as { questions?: unknown } | null)?.questions);
        if (normalizedNested && normalizedNested.length > 0) {
            const newQuestions = annotateQuestionSource(normalizedNested.slice(0, generationCount), 'ai');
            const persisted = await persistQuestionsToDB(userId, newQuestions, 'ai', generationJobId);
            const source = await resolveSafeGeneratedQuestions(
                persisted,
                userId,
                generationJobId,
                generationCount
            );
            const mergedWithoutFallbackTopUp = mergeUniqueQuestions(cachedQuestions, source);
            const finalQuestions = await ensureMinimumQuestionCount(mergedWithoutFallbackTopUp, userId, generationJobId);
            await completeGenerationJob(
                generationJobId,
                newQuestions,
                persisted.length,
                cachedQuestions.length,
                Math.max(0, finalQuestions.length - mergedWithoutFallbackTopUp.length),
                providerUsage
            );
            return finalQuestions;
        }

        await failGenerationJob(generationJobId, 'Gemini returned an invalid question payload');
        const fallback = await generateFallbackQuestions(generationCount, userId);
        const persistedFallback = await persistQuestionsToDB(userId, fallback, 'fallback', generationJobId);
        const source = persistedFallback.length > 0 ? persistedFallback : fallback;
        return ensureMinimumQuestionCount(mergeUniqueQuestions(cachedQuestions, source), userId, generationJobId);
    } catch (error) {
        await failGenerationJob(generationJobId, error);
        const userId = await getUserId();
        const cachedQuestions = userId
            ? await loadPendingQuestionsFromDB(userId, targetCount, maxServedCount)
            : [];
        if (cachedQuestions.length >= targetCount) {
            return cachedQuestions.slice(0, targetCount);
        }

        const missingCount = targetCount - cachedQuestions.length;
        const fallback = await generateFallbackQuestions(missingCount, userId);
        const persistedFallback = await persistQuestionsToDB(userId, fallback, 'fallback', generationJobId);
        const source = persistedFallback.length > 0 ? persistedFallback : fallback;
        return ensureMinimumQuestionCount(mergeUniqueQuestions(cachedQuestions, source), userId, generationJobId);
    }
}
