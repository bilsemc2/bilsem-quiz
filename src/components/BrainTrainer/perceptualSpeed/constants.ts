export const GAME_ID = "algisal-hiz";
export const GAME_TITLE = "Algısal Hız Testi";
export const GAME_DESCRIPTION =
  "İki sayı dizisini saniyeler içinde karşılaştır. Gözlerin ne kadar keskin, zihnin ne kadar hızlı?";
export const TUZO_TEXT = "TUZÖ 5.6.1 İşleme Hızı";

export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const BASE_DIGIT_LENGTH = 5;
export const MAX_DIGIT_LENGTH = 9;
export const CORRECT_TO_ADVANCE = 3;
export const FEEDBACK_DURATION_MS = 1200;

export const CONFUSION_PAIRS: Record<string, string[]> = {
  "1": ["7"],
  "2": ["5"],
  "3": ["8", "5"],
  "5": ["2", "3"],
  "6": ["9", "0"],
  "7": ["1"],
  "8": ["3", "0"],
  "9": ["6"],
};
