import { GAME_COLORS } from "../shared/gameColors.ts";

export const GAME_ID = "cift-mod-hafiza";
export const GAME_TITLE = "Çift Mod Hafıza";
export const GAME_DESCRIPTION =
  "Hem şekilleri hem renkleri hafızana yaz! Çift yönlü sorularla zihnini test et.";
export const TUZO_TEXT = "TUZÖ 5.2.1 Görsel Hafıza";
export const MAX_LEVEL = 20;
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const FEEDBACK_DURATION_MS = 1000;
export const ANSWER_RESULT_DELAY_MS = 1200;
export const MEMORIZE_TICK_MS = 1000;

export const SYMBOLS = ["⭐", "▲", "●", "◆", "⬟", "⬢", "♠", "♥"] as const;

export const COLOR_OPTIONS = [
  { hex: GAME_COLORS.incorrect, name: "Kırmızı" },
  { hex: GAME_COLORS.blue, name: "Mavi" },
  { hex: GAME_COLORS.emerald, name: "Yeşil" },
  { hex: GAME_COLORS.yellow, name: "Sarı" },
  { hex: GAME_COLORS.purple, name: "Mor" },
  { hex: GAME_COLORS.pink, name: "Pembe" },
  { hex: GAME_COLORS.orange, name: "Turuncu" },
] as const;
