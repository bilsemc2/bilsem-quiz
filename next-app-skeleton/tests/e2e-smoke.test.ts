import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET as getAdminReport } from '../app/(dashboard)/admin/reports/[reportType]/route';
import { GET as getGameById } from '../app/api/games/[gameId]/route';
import { GET as getHealth } from '../app/api/health/route';
import { GET as getWorkshops } from '../app/api/workshops/route';
import { POST as trackWebVital } from '../app/api/web-vitals/route';
import { GET as authCallback } from '../app/auth/callback/route';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('e2e smoke flows', () => {
  it('returns health payload', async () => {
    const response = await getHealth();
    const body = (await response.json()) as { status: string; database: boolean };

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(typeof body.database).toBe('boolean');
  });

  it('returns workshop catalog', async () => {
    const response = await getWorkshops();
    const body = (await response.json()) as Array<{ id: string }>;

    expect(response.status).toBe(200);
    expect(body.length).toBeGreaterThan(0);
    expect(body.some((item) => item.id === 'bireysel-degerlendirme')).toBe(true);
  });

  it('returns game details for migrated game id', async () => {
    const response = await getGameById(new Request('http://localhost/api/games/farki-bul'), {
      params: Promise.resolve({ gameId: 'farki-bul' }),
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as { id: string };
    expect(body.id).toBe('farki-bul');
  });

  it('returns 404 for unknown game id', async () => {
    const response = await getGameById(new Request('http://localhost/api/games/unknown'), {
      params: Promise.resolve({ gameId: 'unknown-game' }),
    });

    expect(response.status).toBe(404);
  });

  it('accepts valid web-vitals payload', async () => {
    const response = await trackWebVital(
      new Request('http://localhost/api/web-vitals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: 'metric-1',
          name: 'LCP',
          value: 1234.5,
          delta: 50,
          rating: 'good',
          path: '/dashboard',
        }),
      }),
    );

    expect(response.status).toBe(202);

    const body = (await response.json()) as { accepted: boolean };
    expect(body.accepted).toBe(true);
  });

  it('exports users report through admin route', async () => {
    const response = await getAdminReport(new Request('http://localhost/admin/reports/users?format=csv'), {
      params: Promise.resolve({ reportType: 'users' }),
    });

    const contentDisposition = response.headers.get('content-disposition') ?? '';

    expect(response.status).toBe(200);
    expect(contentDisposition).toContain('admin-users-report');
    expect(contentDisposition).toContain('.csv');
  });

  it('redirects auth callback error to login page', async () => {
    const response = await authCallback(
      new Request(
        'http://localhost/auth/callback?error_description=Provider%20denied&next=%2Fdashboard',
      ),
    );

    const location = response.headers.get('location') ?? '';

    expect(response.status).toBe(307);
    expect(location).toContain('/login');
    expect(location).toContain('Provider+denied');
  });

  it('stores game play with valid payload', async () => {
    const recordGamePlay = vi.fn().mockResolvedValue('gp-1');

    vi.doMock('@/server/services/game.service', () => ({
      recordGamePlay,
    }));

    const { POST } = await import('../app/api/game-plays/route');

    const response = await POST(
      new Request('http://localhost/api/game-plays', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: null,
          gameId: 'farki-bul',
          scoreAchieved: 120,
          durationSeconds: 45,
        }),
      }),
    );

    const body = (await response.json()) as { id: string };

    expect(response.status).toBe(201);
    expect(body.id).toBe('gp-1');
    expect(recordGamePlay).toHaveBeenCalledTimes(1);
  });
});
