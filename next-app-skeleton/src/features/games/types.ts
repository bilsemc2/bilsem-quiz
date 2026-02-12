import type { GameCategory } from '@/shared/types/domain';

export interface GameRegistryItem {
  id: string;
  title: string;
  category: GameCategory;
  durationSeconds: number;
  description: string;
  migrated: boolean;
}
