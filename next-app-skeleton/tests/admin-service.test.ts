import { describe, expect, it } from 'vitest';

import { listAdminGamePlays, listAdminUsers } from '@/server/services/admin.service';

describe('admin.service', () => {
  it('returns users list without throwing', async () => {
    const users = await listAdminUsers(5);
    expect(Array.isArray(users)).toBe(true);
  });

  it('returns game play list without throwing', async () => {
    const gamePlays = await listAdminGamePlays(5);
    expect(Array.isArray(gamePlays)).toBe(true);
  });
});
