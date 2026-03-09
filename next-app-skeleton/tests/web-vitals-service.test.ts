import { describe, expect, it } from 'vitest';

import { normalizeWebVitalPayload } from '@/server/services/web-vitals.service';

describe('web-vitals.service', () => {
  it('normalizes path and string lengths', () => {
    const normalized = normalizeWebVitalPayload({
      id: '  sample-id-1  ',
      name: 'LCP',
      value: 1999.5,
      delta: 150,
      rating: 'good',
      navigationType: 'navigate',
      path: 'home',
      href: 'https://example.com/home',
      userAgent: 'UA',
      recordedAt: '2026-03-05T10:00:00.000Z',
    });

    expect(normalized.metricId).toBe('sample-id-1');
    expect(normalized.path).toBe('/home');
    expect(normalized.metricValue).toBe(1999.5);
    expect(normalized.metricDelta).toBe(150);
  });

  it('falls back to root path for empty route', () => {
    const normalized = normalizeWebVitalPayload({
      id: 'sample-id-2',
      name: 'CLS',
      value: 0.03,
      delta: 0.03,
      rating: 'good',
      path: '   ',
    });

    expect(normalized.path).toBe('/');
    expect(normalized.navigationType).toBeNull();
  });
});
