import { describe, expect, it } from 'vitest';

import { buildPathWithQuery, normalizeNextPath } from '@/server/auth/redirect-utils';

describe('auth redirect utils', () => {
  it('keeps safe internal path', () => {
    expect(normalizeNextPath('/games/farki-bul')).toBe('/games/farki-bul');
  });

  it('keeps reset-password path for recovery callback', () => {
    expect(normalizeNextPath('/reset-password')).toBe('/reset-password');
  });

  it('falls back on external path', () => {
    expect(normalizeNextPath('https://evil.com')).toBe('/dashboard');
  });

  it('falls back on blocked auth routes', () => {
    expect(normalizeNextPath('/login')).toBe('/dashboard');
    expect(normalizeNextPath('/signup')).toBe('/dashboard');
    expect(normalizeNextPath('/auth/callback')).toBe('/dashboard');
  });

  it('builds query string from non-empty params', () => {
    expect(
      buildPathWithQuery('/login', {
        error: 'Bad credentials',
        next: '/games',
        ignore: null,
      }),
    ).toBe('/login?error=Bad+credentials&next=%2Fgames');
  });
});
