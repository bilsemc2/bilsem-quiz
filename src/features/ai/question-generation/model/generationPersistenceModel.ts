import type {
    AdaptiveQuestion,
    AIProviderUsage,
    AIQuestionGenerationMetadata
} from '../../model/types.ts';
import type { StoryTheme } from '../../../../shared/story/types.ts';
import {
    estimateQuestionGenerationTelemetry,
    type QuestionGenerationTelemetry
} from './generationTelemetryModel.ts';
import { normalizeProviderUsage } from './providerUsageModel.ts';

export interface BuildQuestionFingerprintInput {
    stem: string;
    options: readonly string[] | string;
}

export interface StoryQuestionGenerationContextInput {
    story: {
        title?: string;
        content?: string;
        summary?: string;
        theme?: StoryTheme;
    };
    locale: 'tr' | 'en';
    requestedQuestionCount: number;
    generationMetadata?: Partial<AIQuestionGenerationMetadata> | null;
}

export interface BuildQuestionGenerationResponseSummaryInput {
    requestedQuestionCount: number;
    cachedQuestionCount: number;
    aiQuestions: AdaptiveQuestion[];
    fallbackQuestionCount: number;
    persistedQuestionCount: number;
    requestContext?: Record<string, unknown> | null;
    providerUsage?: AIProviderUsage | Record<string, unknown> | null;
    generationMetadata?: Partial<AIQuestionGenerationMetadata> | null;
}

const MAX_ERROR_MESSAGE_LENGTH = 240;

export const buildGenerationMetadataRecord = (
    metadata?: Partial<AIQuestionGenerationMetadata> | null
): Record<string, string | null> | null => {
    const normalized = {
        providerName: metadata?.providerName ?? null,
        modelName: metadata?.modelName ?? null,
        promptVersion: metadata?.promptVersion ?? null,
        promptProfileId: metadata?.promptProfileId ?? null
    };

    return Object.values(normalized).every((value) => value === null)
        ? null
        : normalized;
};

export const attachGenerationMetadata = <T extends Record<string, unknown>>(
    base: T,
    metadata?: Partial<AIQuestionGenerationMetadata> | null
): T & { generationMetadata?: Record<string, string | null> } => {
    const generationMetadata = buildGenerationMetadataRecord(metadata);

    if (!generationMetadata) {
        return { ...base };
    }

    return {
        ...base,
        generationMetadata
    };
};

export const normalizeQuestionText = (value: string): string => {
    return value
        .toLocaleLowerCase('tr-TR')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ı/g, 'i')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

export const toQuestionOptions = (value: readonly string[] | string): string[] => {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value) as unknown;
            return Array.isArray(parsed)
                ? parsed.filter((item): item is string => typeof item === 'string')
                : [];
        } catch {
            return [];
        }
    }

    return [];
};

export const buildQuestionFingerprint = (input: BuildQuestionFingerprintInput): string => {
    const stem = normalizeQuestionText(input.stem);
    const options = toQuestionOptions(input.options)
        .map((option) => normalizeQuestionText(option))
        .filter((option) => option.length > 0)
        .sort();

    return `${stem}::${options.join('|')}`;
};

export const buildStoryQuestionGenerationContext = (
    input: StoryQuestionGenerationContextInput
): Record<string, unknown> => ({
    ...attachGenerationMetadata(
        {
            locale: input.locale,
            requestedQuestionCount: input.requestedQuestionCount,
            storyTitle: input.story.title?.trim() || null,
            storyTheme: input.story.theme || null,
            storyContentLength: input.story.content?.trim().length ?? 0,
            summaryLength: input.story.summary?.trim().length ?? 0,
            hasSummary: Boolean(input.story.summary?.trim())
        },
        input.generationMetadata
    )
});

export const buildQuestionGenerationResponseSummary = (
    input: BuildQuestionGenerationResponseSummaryInput
): Record<string, unknown> => {
    const aiQuestionCount = input.aiQuestions.length;
    const aiSourceCounts = input.aiQuestions.reduce(
        (totals, question) => {
            if (question.source === 'fallback') {
                totals.fallback += 1;
            } else {
                totals.ai += 1;
            }

            return totals;
        },
        { ai: 0, fallback: 0 }
    );
    const telemetry: QuestionGenerationTelemetry = estimateQuestionGenerationTelemetry({
        requestedQuestionCount: input.requestedQuestionCount,
        generatedQuestionCount: aiQuestionCount,
        cachedQuestionCount: input.cachedQuestionCount,
        requestContext: input.requestContext
    });
    const providerUsage = normalizeProviderUsage(input.providerUsage);

    return attachGenerationMetadata(
        {
            requestedQuestionCount: input.requestedQuestionCount,
            cachedQuestionCount: input.cachedQuestionCount,
            receivedQuestionCount: aiQuestionCount,
            persistedQuestionCount: input.persistedQuestionCount,
            fallbackQuestionCount: input.fallbackQuestionCount,
            sources: aiSourceCounts,
            telemetry,
            ...(providerUsage ? { providerUsage } : {})
        },
        input.generationMetadata
    );
};

export const toSafeGenerationErrorMessage = (error: unknown): string => {
    const rawMessage =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
                ? error
                : 'AI generation failed';

    const normalized = rawMessage.replace(/\s+/g, ' ').trim();
    if (normalized.length <= MAX_ERROR_MESSAGE_LENGTH) {
        return normalized;
    }

    return `${normalized.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1)}…`;
};
