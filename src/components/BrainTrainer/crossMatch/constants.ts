import { GAME_COLORS } from "../shared/gameColors.ts";

export const GAME_ID = "capraz-eslesme";
export const GAME_TITLE = "Çapraz Eşleşme";
export const GAME_DESCRIPTION =
  "Hem renkleri hem şekilleri hatırla! Dikkat et, kartlar yer değiştirebilir.";
export const TUZO_TEXT = "TUZÖ 5.4.2 Görsel Kısa Süreli Bellek";

export const MAX_LEVEL = 20;
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;

export const PREVIEW_DURATION_MS = 3000;
export const MATCH_REVEAL_DELAY_MS = 500;
export const MISMATCH_REVEAL_DELAY_MS = 1000;
export const FEEDBACK_DURATION_MS = 1200;

export const COLORS = [
  { name: "Yeşil", hex: GAME_COLORS.emerald },
  { name: "Turuncu", hex: GAME_COLORS.orange },
  { name: "Mavi", hex: GAME_COLORS.blue },
  { name: "Pembe", hex: GAME_COLORS.pink },
  { name: "Mor", hex: GAME_COLORS.purple },
] as const;

export const SHAPE_COUNT = 9;
