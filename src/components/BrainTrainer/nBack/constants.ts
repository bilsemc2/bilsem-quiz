import { GAME_COLORS } from "../shared/gameColors.ts";

export const GAME_ID = "n-geri-sifresi";
export const GAME_TITLE = "N-Geri Şifresi";
export const GAME_DESCRIPTION =
  "Şekilleri hatırla ve karşılaştır! Her şekli N adım öncekiyle karşılaştırarak belleğini test et.";
export const TUZO_TEXT = "TUZÖ 5.9.1 Çalışma Belleği";
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1200;
export const NEXT_SHAPE_DELAY_MS = 500;
export const SHAPE_EXPOSURE_MS = 1000;
export const MAX_N_VALUE = 4;

export const SHAPE_DEFINITIONS = [
  { key: "square", color: "#FFE81A" },
  { key: "circle", color: "#00FF9D" },
  { key: "triangle", color: "#FF1493" },
  { key: "pentagon", color: GAME_COLORS.blue },
  { key: "hexagon", color: "#FF5722" },
] as const;
