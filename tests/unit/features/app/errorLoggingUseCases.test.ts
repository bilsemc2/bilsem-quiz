import assert from 'node:assert/strict';
import test from 'node:test';
import {
    logRuntimeError,
    toRuntimeErrorLogInput
} from '../../../../src/features/app/model/errorLoggingUseCases.ts';

test('toRuntimeErrorLogInput truncates stack values and preserves metadata', () => {
    const error = new Error('Beklenmeyen hata');
    error.stack = 'x'.repeat(2500);

    const payload = toRuntimeErrorLogInput({
        error,
        componentStack: 'y'.repeat(2500),
        url: 'https://bilsemc2.com/app',
        userAgent: 'test-agent',
        createdAtISO: '2026-03-12T12:00:00.000Z'
    });

    assert.equal(payload.errorMessage, 'Beklenmeyen hata');
    assert.equal(payload.errorStack?.length, 2000);
    assert.equal(payload.componentStack?.length, 2000);
    assert.equal(payload.url, 'https://bilsemc2.com/app');
    assert.equal(payload.createdAt, '2026-03-12T12:00:00.000Z');
});

test('logRuntimeError returns false when repository logging fails', async () => {
    const saved = await logRuntimeError(
        {
            error: new Error('Hata'),
            componentStack: null,
            url: 'https://bilsemc2.com/app',
            userAgent: 'test-agent'
        },
        {
            createErrorLog: async () => {
                throw new Error('insert failed');
            }
        }
    );

    assert.equal(saved, false);
});
