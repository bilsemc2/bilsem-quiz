export interface DeyimRow {
  id: number;
  deyim: string;
  aciklama: string;
  ornek: string | null;
}

export interface DeyimlerQuestion {
  deyim: DeyimRow;
  missingWord: string;
  displayText: string;
  options: string[];
}
