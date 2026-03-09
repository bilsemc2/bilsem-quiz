export interface SynonymOption {
  id: string;
  text: string;
}

export interface SynonymQuestion {
  id: number;
  word: string;
  options: SynonymOption[];
  correctOptionId: string;
  synonym: string;
}

export interface SynonymRow {
  id: number;
  kelime: string;
  secenek_a: string;
  secenek_b: string;
  secenek_c: string;
  secenek_d: string;
  dogru_cevap: string;
  es_anlami: string;
}

export type SynonymPhase = "loading" | "ready" | "error";
