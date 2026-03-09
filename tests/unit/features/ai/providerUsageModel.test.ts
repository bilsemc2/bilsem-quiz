import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeProviderUsage } from '../../../../src/features/ai/question-generation/model/providerUsageModel.ts';

test('normalizeProviderUsage returns null for invalid payloads', () => {
    assert.equal(normalizeProviderUsage(null), null);
    assert.equal(normalizeProviderUsage('bad'), null);
    assert.equal(normalizeProviderUsage({}), null);
});

test('normalizeProviderUsage normalizes numeric token fields', () => {
    assert.deepEqual(
        normalizeProviderUsage({
            promptTokens: '700',
            completionTokens: 1200,
            totalTokens: '1900',
            cachedTokens: '80'
        }),
        {
            promptTokens: 700,
            completionTokens: 1200,
            totalTokens: 1900,
            cachedTokens: 80
        }
    );
});
