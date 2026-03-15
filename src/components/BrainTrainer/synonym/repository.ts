import { loadSynonymRows } from '@/features/games/model/brainTrainerContentUseCases';

import type { SynonymRow } from "./types";

export const fetchSynonymRows = async () => {
  return (await loadSynonymRows()) as SynonymRow[];
};
