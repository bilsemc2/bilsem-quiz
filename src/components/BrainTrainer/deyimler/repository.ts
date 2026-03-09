import { supabase } from "../../../lib/supabase";

import type { DeyimRow } from "./types.ts";

export const fetchDeyimlerRows = async () => {
  const { data, error } = await supabase
    .from("deyimler")
    .select("id, deyim, aciklama, ornek")
    .eq("child_safe", true);

  if (error) {
    throw error;
  }

  return (data ?? []) as DeyimRow[];
};
