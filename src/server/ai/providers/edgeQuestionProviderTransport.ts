import { supabase } from '@/lib/supabase';
import type {
    AdaptiveQuestion,
    AIQuestionProviderResult,
    AIQuestionProviderInput,
    AIProviderUsage,
    DifficultyLevel
} from '@/features/ai/model/types';
import { sanitizeQuestion } from '@/features/ai/quality-safety/model/questionSafety';
import { validateAdaptiveQuestionSchema } from '@/features/ai/quality-safety/model/questionSchemaValidator';
import { buildAdaptiveQuestionPromptTemplate } from '@/server/ai/prompts/adaptiveQuestionPromptTemplate';
import { normalizeProviderUsage } from '@/features/ai/question-generation/model/providerUsageModel.ts';
import type { QuestionProviderName } from './providerRegistry.ts';

const getProviderModelName = (provider: QuestionProviderName): string => {
    if (provider === 'openai') {
        return 'gpt-4o-mini';
    }

    return 'gemini-3-flash-preview';
};

const getEdgeFunctionUrl = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/gemini-proxy`;
};

const tryParseJson = (value: string): unknown => {
    try {
        return JSON.parse(value) as unknown;
    } catch {
        return null;
    }
};

const normalizeProxyResult = (value: unknown): unknown => {
    const parsed = typeof value === 'string' ? tryParseJson(value) : value;
    if (!parsed || typeof parsed !== 'object') {
        return parsed;
    }

    return parsed;
};

const extractSuggestedDifficultyLevel = (value: unknown): DifficultyLevel | null => {
    const parsed = normalizeProxyResult(value);
    if (!parsed || typeof parsed !== 'object') {
        return null;
    }

    const candidate = parsed as { suggestedDifficultyLevel?: unknown };
    const suggestedDifficultyLevel = Number(candidate.suggestedDifficultyLevel);
    if (!Number.isFinite(suggestedDifficultyLevel)) {
        return null;
    }

    const normalized = Math.round(suggestedDifficultyLevel);
    if (normalized < 1 || normalized > 5) {
        return null;
    }

    return normalized as DifficultyLevel;
};

const parseAdaptiveQuestion = (value: unknown): AdaptiveQuestion | null => {
    const normalized = normalizeProxyResult(value);
    const candidate =
        normalized && typeof normalized === 'object' && !Array.isArray(normalized)
            ? (normalized as { question?: unknown }).question ?? normalized
            : normalized;
    const validation = validateAdaptiveQuestionSchema(candidate);
    if (!validation.success) {
        return null;
    }

    return sanitizeQuestion(validation.value);
};

const extractUsage = (value: unknown): AIProviderUsage | null => {
    const parsed = normalizeProxyResult(value);
    if (!parsed || typeof parsed !== 'object') {
        return null;
    }

    return normalizeProviderUsage((parsed as { usage?: unknown }).usage);
};

export const invokeEdgeAdaptiveQuestionProvider = async (
    provider: QuestionProviderName,
    input: AIQuestionProviderInput
): Promise<AIQuestionProviderResult> => {
    const promptTemplate = buildAdaptiveQuestionPromptTemplate(input);
    const metadata = {
        providerName: provider,
        modelName: getProviderModelName(provider),
        promptVersion: promptTemplate.version,
        promptProfileId: promptTemplate.profileId
    };

    try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const response = await fetch(getEdgeFunctionUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                action: 'generateAdaptiveQuestion',
                provider,
                input,
                promptTemplate
            })
        });

        if (!response.ok) {
            return {
                question: null,
                metadata
            };
        }

        const payload = await response.json() as { result?: unknown };
        return {
            question: parseAdaptiveQuestion(payload?.result),
            metadata,
            suggestedDifficultyLevel: extractSuggestedDifficultyLevel(payload?.result),
            usage: extractUsage(payload?.result)
        };
    } catch {
        return {
            question: null,
            metadata,
            suggestedDifficultyLevel: null,
            usage: null
        };
    }
};
