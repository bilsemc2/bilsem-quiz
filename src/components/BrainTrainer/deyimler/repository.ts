import { loadBrainTrainerDeyimRows } from '@/features/games/model/brainTrainerContentUseCases';

import type { DeyimRow } from "./types.ts";

export const fetchDeyimlerRows = async () => {
  return (await loadBrainTrainerDeyimRows()) as DeyimRow[];
};
