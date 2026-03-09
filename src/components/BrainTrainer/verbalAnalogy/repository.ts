import { supabase } from "../../../lib/supabase";

import { FETCH_LIMIT } from "./constants";
import type { VerbalAnalogyRow } from "./types";

export const fetchVerbalAnalogyRows = async () => {
  const { data, error } = await supabase
    .from("analoji_sorulari")
    .select(
      "id, soru_metni, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, aciklama",
    )
    .limit(FETCH_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []) as VerbalAnalogyRow[];
};
