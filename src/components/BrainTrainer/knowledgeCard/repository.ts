import { loadKnowledgeCardRows } from '@/features/games/model/brainTrainerContentUseCases';

import type { KnowledgeCardRow } from "./types";

export const fetchKnowledgeCardRows = async () => {
  return (await loadKnowledgeCardRows()) as KnowledgeCardRow[];
};
