import { supabase } from '@/lib/supabase';
import type { AdaptiveQuestion, AIQuestionProvider, AIQuestionProviderInput } from '../../../features/ai/model/types';
import { sanitizeQuestion } from '../../../features/ai/quality-safety/model/questionSafety';
import { validateAdaptiveQuestionSchema } from '../../../features/ai/quality-safety/model/questionSchemaValidator';
import { buildAdaptiveQuestionPromptTemplate } from '../prompts/adaptiveQuestionPromptTemplate';

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

    const candidate = parsed as { question?: unknown };
    return candidate.question ?? parsed;
};

const parseAdaptiveQuestion = (value: unknown): AdaptiveQuestion | null => {
    const normalized = normalizeProxyResult(value);
    const validation = validateAdaptiveQuestionSchema(normalized);
    if (!validation.success) {
        return null;
    }

    return sanitizeQuestion(validation.value);
};

const callGeminiProxy = async (payload: object, accessToken?: string): Promise<AdaptiveQuestion | null> => {
    const response = await fetch(getEdgeFunctionUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json() as { result?: unknown };
    return parseAdaptiveQuestion(data?.result);
};

export const geminiQuestionProvider: AIQuestionProvider = {
    generateQuestion: async (input: AIQuestionProviderInput) => {
        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            const promptTemplate = buildAdaptiveQuestionPromptTemplate(input);

            return await callGeminiProxy(
                {
                    action: 'generateAdaptiveQuestion',
                    input,
                    promptTemplate
                },
                token
            );
        } catch {
            return null;
        }
    }
};
