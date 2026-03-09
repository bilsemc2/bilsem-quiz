import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getRegisteredQuestionProviders,
    resolveQuestionProviderOrder
} from '../../../../src/server/ai/providers/providerRegistry.ts';

test('resolveQuestionProviderOrder defaults to openai then gemini', () => {
    assert.deepEqual(resolveQuestionProviderOrder(undefined), ['openai', 'gemini']);
});

test('resolveQuestionProviderOrder filters invalid providers and deduplicates', () => {
    assert.deepEqual(
        resolveQuestionProviderOrder('gemini,openai,gemini,invalid'),
        ['gemini', 'openai']
    );
});

test('getRegisteredQuestionProviders returns providers in resolved order', () => {
    const providers = getRegisteredQuestionProviders('gemini,openai');

    assert.deepEqual(
        providers.map((provider) => provider.name),
        ['gemini', 'openai']
    );
});
