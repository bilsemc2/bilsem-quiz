import { loadVerbalAnalogyRows } from '@/features/games/model/brainTrainerContentUseCases';

import { FETCH_LIMIT } from "./constants";
import type { VerbalAnalogyRow } from "./types";

export const fetchVerbalAnalogyRows = async () => {
  const rows = await loadVerbalAnalogyRows();
  return rows.slice(0, FETCH_LIMIT) as VerbalAnalogyRow[];
};
