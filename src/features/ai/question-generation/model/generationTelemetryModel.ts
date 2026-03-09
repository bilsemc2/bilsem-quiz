export interface QuestionGenerationTelemetry {
    estimatedPromptTokens: number;
    estimatedCompletionTokens: number;
    estimatedTotalTokens: number;
    cacheReuseRate: number;
}

export interface EstimateQuestionGenerationTelemetryInput {
    requestedQuestionCount: number;
    generatedQuestionCount: number;
    cachedQuestionCount?: number;
    requestContext?: Record<string, unknown> | null;
}

const BASE_PROMPT_CHAR_BUDGET = 600;
const CHARS_PER_TOKEN = 4;
const OUTPUT_TOKENS_PER_QUESTION = 140;
const REQUESTED_QUESTION_PROMPT_CHARS = 180;

const toSafeNumber = (value: unknown): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const roundRate = (value: number): number => {
    return Number(value.toFixed(1));
};

export const estimateQuestionGenerationTelemetry = (
    input: EstimateQuestionGenerationTelemetryInput
): QuestionGenerationTelemetry => {
    const requestedQuestionCount = Math.max(0, Math.round(input.requestedQuestionCount));
    const generatedQuestionCount = Math.max(0, Math.round(input.generatedQuestionCount));
    const cachedQuestionCount = Math.max(0, Math.round(input.cachedQuestionCount ?? 0));
    const storyContentLength = toSafeNumber(input.requestContext?.storyContentLength);
    const summaryLength = toSafeNumber(input.requestContext?.summaryLength);
    const storyTitleLength =
        typeof input.requestContext?.storyTitle === 'string'
            ? input.requestContext.storyTitle.length
            : 0;

    const estimatedPromptChars =
        BASE_PROMPT_CHAR_BUDGET +
        storyContentLength +
        summaryLength +
        storyTitleLength +
        requestedQuestionCount * REQUESTED_QUESTION_PROMPT_CHARS;
    const estimatedPromptTokens = Math.max(1, Math.round(estimatedPromptChars / CHARS_PER_TOKEN));
    const estimatedCompletionTokens = Math.max(
        0,
        generatedQuestionCount * OUTPUT_TOKENS_PER_QUESTION
    );
    const estimatedTotalTokens = estimatedPromptTokens + estimatedCompletionTokens;
    const cacheReuseDenominator = requestedQuestionCount + cachedQuestionCount;
    const cacheReuseRate =
        cacheReuseDenominator > 0
            ? roundRate((cachedQuestionCount / cacheReuseDenominator) * 100)
            : 0;

    return {
        estimatedPromptTokens,
        estimatedCompletionTokens,
        estimatedTotalTokens,
        cacheReuseRate
    };
};
