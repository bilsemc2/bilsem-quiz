import { supabase } from "../../../lib/supabase";

import type { SynonymRow } from "./types";

export const fetchSynonymRows = async () => {
  const { data, error } = await supabase
    .from("es_anlam_sorulari")
    .select(
      "id, kelime, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, es_anlami",
    )
    .limit(100);

  if (error) {
    throw error;
  }

  return (data ?? []) as SynonymRow[];
};
