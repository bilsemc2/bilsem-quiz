import type { UserProfileSummary } from '@/shared/types/domain';

import { listProfiles } from '@/server/repositories/profile.repository';

export async function listProfileSummaries(limit = 50): Promise<UserProfileSummary[]> {
  const rows = await listProfiles(limit);

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name ?? row.name,
    role: row.role,
    experience: row.experience,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}
