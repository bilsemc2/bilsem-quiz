import { supabase } from "../../../lib/supabase";

import type { KnowledgeCardRow } from "./types";

export const fetchKnowledgeCardRows = async () => {
  const { data, error } = await supabase
    .from("bilgi_kartlari")
    .select("id, icerik")
    .eq("is_active", true)
    .limit(100);

  if (error) {
    throw error;
  }

  return (data ?? []) as KnowledgeCardRow[];
};
