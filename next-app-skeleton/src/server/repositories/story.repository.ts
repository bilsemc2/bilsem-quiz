import type { QueryResultRow } from 'pg';

import { db } from '@/server/db/client';

interface StoryRow extends QueryResultRow {
  id: string;
  title: string;
  age_range: string;
  theme: string;
  is_active: boolean;
}

export async function listActiveStories(limit = 12): Promise<StoryRow[]> {
  return db.query<StoryRow>(
    `
      SELECT id, title, age_range, theme, is_active
      FROM public.story
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [limit],
  );
}
