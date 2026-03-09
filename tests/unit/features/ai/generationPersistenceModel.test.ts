import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildGenerationMetadataRecord,
    buildQuestionFingerprint,
    buildQuestionGenerationResponseSummary,
    buildStoryQuestionGenerationContext,
    toSafeGenerationErrorMessage
} from '../../../../src/features/ai/question-generation/model/generationPersistenceModel.ts';

test('buildQuestionFingerprint normalizes punctuation, accents, and option order', () => {
    const firstFingerprint = buildQuestionFingerprint({
        stem: 'Çıkarım: Hangisi doğru?',
        options: ['Elma!', 'Armut', 'Masa', 'Kalem']
    });
    const secondFingerprint = buildQuestionFingerprint({
        stem: 'Cikarim hangisi dogru',
        options: ['Kalem', 'Masa', 'Armut', 'Elma']
    });

    assert.equal(firstFingerprint, secondFingerprint);
});

test('buildStoryQuestionGenerationContext stores only redacted story metadata', () => {
    const context = buildStoryQuestionGenerationContext({
        story: {
            title: 'Uzay Macerasi',
            content: 'Bu ham içerik veritabanına aynen gitmemeli.',
            summary: 'Kisa ozet',
            theme: 'science'
        },
        locale: 'tr',
        requestedQuestionCount: 6,
        generationMetadata: {
            providerName: 'gemini',
            modelName: 'gemini-3-flash-preview',
            promptVersion: 'story.questions.v1.0.0',
            promptProfileId: 'story.bilsem.core'
        }
    });

    assert.deepEqual(context, {
        locale: 'tr',
        requestedQuestionCount: 6,
        storyTitle: 'Uzay Macerasi',
        storyTheme: 'science',
        storyContentLength: 'Bu ham içerik veritabanına aynen gitmemeli.'.length,
        summaryLength: 'Kisa ozet'.length,
        hasSummary: true,
        generationMetadata: {
            providerName: 'gemini',
            modelName: 'gemini-3-flash-preview',
            promptVersion: 'story.questions.v1.0.0',
            promptProfileId: 'story.bilsem.core'
        }
    });
});

test('buildQuestionGenerationResponseSummary reports ai and fallback counts separately', () => {
    const summary = buildQuestionGenerationResponseSummary({
        requestedQuestionCount: 5,
        cachedQuestionCount: 2,
        aiQuestions: [
            {
                id: 'q-1',
                topic: 'mantik',
                stem: '1, 2, 3, ?',
                options: ['4', '5', '6', '7'],
                correctIndex: 0,
                explanation: 'Birer artar.',
                difficultyLevel: 2,
                source: 'ai'
            },
            {
                id: 'q-2',
                topic: 'mantik',
                stem: '2, 4, 6, ?',
                options: ['7', '8', '9', '10'],
                correctIndex: 1,
                explanation: 'İkişer artar.',
                difficultyLevel: 2,
                source: 'fallback'
            }
        ],
        fallbackQuestionCount: 3,
        persistedQuestionCount: 2,
        providerUsage: {
            promptTokens: 720,
            completionTokens: 1380,
            totalTokens: 2100,
            cachedTokens: 120
        },
        generationMetadata: {
            providerName: 'openai',
            modelName: 'gpt-4o-mini',
            promptVersion: 'aq.logic.core.v1.0.0',
            promptProfileId: 'logic.core'
        }
    });

    assert.deepEqual(summary, {
        requestedQuestionCount: 5,
        cachedQuestionCount: 2,
        receivedQuestionCount: 2,
        persistedQuestionCount: 2,
        fallbackQuestionCount: 3,
        sources: {
            ai: 1,
            fallback: 1
        },
        telemetry: {
            estimatedPromptTokens: 375,
            estimatedCompletionTokens: 280,
            estimatedTotalTokens: 655,
            cacheReuseRate: 28.6
        },
        providerUsage: {
            promptTokens: 720,
            completionTokens: 1380,
            totalTokens: 2100,
            cachedTokens: 120
        },
        generationMetadata: {
            providerName: 'openai',
            modelName: 'gpt-4o-mini',
            promptVersion: 'aq.logic.core.v1.0.0',
            promptProfileId: 'logic.core'
        }
    });
});

test('buildGenerationMetadataRecord normalizes empty metadata to null', () => {
    assert.equal(buildGenerationMetadataRecord(), null);
    assert.equal(
        buildGenerationMetadataRecord({
            providerName: null,
            modelName: null,
            promptVersion: null,
            promptProfileId: null
        }),
        null
    );
});

test('toSafeGenerationErrorMessage trims noisy messages to bounded size', () => {
    const errorMessage = toSafeGenerationErrorMessage(
        new Error(`AI provider timeout ${'x'.repeat(400)}`)
    );

    assert.ok(errorMessage.startsWith('AI provider timeout'));
    assert.ok(errorMessage.length <= 240);
});
