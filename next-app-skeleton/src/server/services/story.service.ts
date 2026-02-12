import type { StorySummary } from '@/shared/types/domain';

import { listActiveStories } from '@/server/repositories/story.repository';

const storyFallback: StorySummary[] = [
  { id: 'fallback-1', title: 'Mars Kasifi', ageBand: '8-10', theme: 'Bilim', isActive: true },
  {
    id: 'fallback-2',
    title: 'Kayip Kodun Pesinde',
    ageBand: '10-12',
    theme: 'Teknoloji',
    isActive: true,
  },
];

export async function listStories(limit = 12): Promise<StorySummary[]> {
  try {
    const rows = await listActiveStories(limit);

    if (rows.length === 0) {
      return storyFallback;
    }

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      ageBand: row.age_range,
      theme: row.theme,
      isActive: row.is_active,
    }));
  } catch {
    return storyFallback;
  }
}
