import { GAME_COLORS } from "../shared/gameColors.ts";
import type { ColorInfo } from "./types.ts";

export const GAME_ID = "sayi-sihirbazi";
export const GAME_TITLE = "Sayı Sihirbazı";
export const GAME_DESCRIPTION =
  "Kartları dikkatle izle, renkleri ve sayıları aklında tut. Sihirli soruları cevaplayarak hafızanı kanıtla.";
export const TUZO_TEXT = "TUZÖ 5.9.1 Çalışma Belleği";
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const CARD_DISPLAY_TIME = 2000;
export const CARD_SEQUENCE_DELAY = 800;
export const INITIAL_FOCUS_DELAY = 800;
export const QUESTION_REVEAL_DELAY = 800;
export const FEEDBACK_DURATION_MS = 1000;
export const ROUND_TRANSITION_MS = 1200;
export const MAX_NUMBER_INPUT_LENGTH = 3;

export const COLORS: ColorInfo[] = [
  { name: "Kırmızı", hex: GAME_COLORS.pink },
  { name: "Mavi", hex: GAME_COLORS.blue },
  { name: "Yeşil", hex: GAME_COLORS.emerald },
  { name: "Sarı", hex: GAME_COLORS.yellow },
  { name: "Mor", hex: GAME_COLORS.purple },
  { name: "Turuncu", hex: GAME_COLORS.orange },
];
