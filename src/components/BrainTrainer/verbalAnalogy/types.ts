export interface VerbalAnalogyOption {
  id: string;
  text: string;
}

export interface VerbalAnalogyQuestion {
  id: number;
  text: string;
  options: VerbalAnalogyOption[];
  correctOptionId: string;
  explanation?: string;
}

export interface VerbalAnalogyRow {
  id: number;
  soru_metni: string;
  secenek_a: string | null;
  secenek_b: string | null;
  secenek_c: string | null;
  secenek_d: string | null;
  dogru_cevap: string | null;
  aciklama: string | null;
}

export type VerbalAnalogyPhase = "loading" | "ready" | "error";
