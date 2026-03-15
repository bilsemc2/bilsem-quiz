import { GAME_COLORS } from "../shared/gameColors.ts";

export const GAME_ID = "kelime-avi";
export const GAME_TITLE = "Kelime Avı";
export const GAME_DESCRIPTION =
  "Hızlı akan harfler arasında gizli hedefleri yakala, algısal işlem hızınla fark yarat!";
export const TUZO_TEXT = "5.6.1 Algısal İşlem Hızı";
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1200;

export const ALPHABET = [..."ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ"];
export const VOWELS = [..."AEIİOÖUÜ"];
export const CONSONANTS = [..."BCÇDFGĞHJKLMNPRSŞTVYZ"];

export const CARD_COLORS = [
  GAME_COLORS.emerald,
  GAME_COLORS.pink,
  GAME_COLORS.blue,
  GAME_COLORS.yellow,
  GAME_COLORS.orange,
  GAME_COLORS.purple,
];

export const GRID_BACKGROUND_STYLE = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
  backgroundSize: "20px 20px",
};
