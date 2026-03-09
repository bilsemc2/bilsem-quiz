import type { QuestionType } from "./types.ts";

export const GAME_ID = "sayisal-sifre";
export const GAME_TITLE = "Sayısal Şifre";
export const GAME_DESCRIPTION =
  "Sayıların arasındaki gizli kuralları keşfet ve şifreleri çöz. Matematiksel mantık yeteneğini geliştir!";
export const TUZO_TEXT = "TUZÖ 5.2.3 Soyut Sayısal Mantık";
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1500;

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  hidden_operator: "Gizli Operatör",
  pair_relation: "Çift İlişkisi",
  conditional: "Koşullu Şifre",
  multi_rule: "Çoklu Kural",
};
