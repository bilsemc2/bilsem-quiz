import { describe, expect, it } from 'vitest';

import {
  computeRetryDelayMs,
  shouldRetryDatabaseError,
  type DbRetryConfig,
} from '@/server/db/client';

describe('db client retry helpers', () => {
  it('marks retryable postgres errors', () => {
    expect(shouldRetryDatabaseError({ code: '40P01', message: 'deadlock detected' })).toBe(true);
    expect(shouldRetryDatabaseError({ code: '08006', message: 'connection failure' })).toBe(true);
  });

  it('marks retryable node network errors', () => {
    expect(shouldRetryDatabaseError({ code: 'ECONNRESET' })).toBe(true);
    expect(shouldRetryDatabaseError({ code: 'ETIMEDOUT' })).toBe(true);
  });

  it('does not retry non-transient errors', () => {
    expect(shouldRetryDatabaseError({ code: '23505', message: 'unique violation' })).toBe(false);
    expect(shouldRetryDatabaseError({ message: 'validation failed' })).toBe(false);
  });

  it('computes bounded exponential delay', () => {
    const config: DbRetryConfig = {
      attempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 250,
    };

    expect(computeRetryDelayMs(1, config)).toBe(100);
    expect(computeRetryDelayMs(2, config)).toBe(200);
    expect(computeRetryDelayMs(3, config)).toBe(250);
    expect(computeRetryDelayMs(8, config)).toBe(250);
  });
});
