export type GameCategory = 'attention' | 'memory' | 'logic' | 'language';

export interface GameSummary {
  id: string;
  title: string;
  category: GameCategory;
  durationSeconds: number;
  description?: string;
  migrated?: boolean;
  playsCount?: number;
  bestScore?: number;
  avgScore?: number;
  avgDurationSeconds?: number;
}

export interface WorkshopModuleSummary {
  id: string;
  title: string;
  description: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  route: string;
  migrated: boolean;
  estimatedMinutes: number;
  tags?: string[];
}

export interface WorkshopSummary {
  id: string;
  title: string;
  description: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  audience?: string;
  moduleCount?: number;
  migrated?: boolean;
}

export interface WorkshopDetail extends WorkshopSummary {
  goals: string[];
  modules: WorkshopModuleSummary[];
}

export interface StorySummary {
  id: string;
  title: string;
  ageBand: string;
  theme?: string;
  isActive?: boolean;
}

export interface UserProfileSummary {
  id: string;
  email: string;
  fullName: string;
  role: string;
  experience: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUserSummary extends UserProfileSummary {
  gamePlayCount: number;
  bestScore: number;
  lastPlayAt: string | null;
}

export interface AdminUserDetail extends AdminUserSummary {
  recentGameIds: string[];
}

export interface AdminGamePlaySummary {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  gameId: string;
  scoreAchieved: number;
  durationSeconds: number;
  livesRemaining: number | null;
  workshopType: string | null;
  intelligenceType: string | null;
  createdAt: string;
}

export interface DashboardStats {
  userCount: number;
  activeUserCount: number;
  activeGames: number;
  todaysSessions: number;
}

export interface SiteNavItem {
  href: string;
  label: string;
}
