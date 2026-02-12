import { describe, expect, it } from 'vitest';

import { listGames } from '@/server/services/game.service';

describe('game.service', () => {
  it('returns at least one game in skeleton data source', async () => {
    const games = await listGames();
    expect(games.length).toBeGreaterThan(0);
  });
});
