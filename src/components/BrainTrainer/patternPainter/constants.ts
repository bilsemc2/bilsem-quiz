import { GAME_COLORS } from "../shared/gameColors.ts";
import type { PatternType } from "./types.ts";

export const GAME_ID = "desen-boyama";
export const GAME_TITLE = "Desen Boyama";
export const GAME_DESCRIPTION =
  "Oruntudeki boslugu dogru renklerle doldur ve deseni tamamla. Renkli bir mantik yolculuguna hazir misin?";
export const TUZO_TEXT = "TUZO 5.3.2 Desen Analizi";

export const MAX_LEVEL = 20;
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const FEEDBACK_DURATION_MS = 1200;
export const GAP_SIZE = 2;

export const PATTERN_COLORS = [
  GAME_COLORS.pink,
  "#00BFFF",
  "#00FF7F",
  GAME_COLORS.yellow,
  GAME_COLORS.purple,
  "#FF6B35",
  "#00CED1",
  GAME_COLORS.pink,
];

export const PATTERN_TYPES: PatternType[] = [
  "checkered",
  "stripes",
  "diagonal",
  "center-out",
  "random-repeating",
];
