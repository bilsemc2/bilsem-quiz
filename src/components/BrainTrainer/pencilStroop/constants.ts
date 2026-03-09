import { GAME_COLORS } from "../shared/gameColors.ts";
import type { PencilColor } from "./types.ts";

export const GAME_ID = "kalem-stroop";
export const GAME_TITLE = "Kalem Stroop";
export const GAME_DESCRIPTION =
  "Kalemin rengine odaklan, üzerindeki yazıya ve buton renklerine aldanma. Zihinsel hızını ve dikkatini kanıtla.";
export const TUZO_TEXT = "TUZÖ 5.1.1 Renk-Kelime Stroop";
export const MAX_LEVEL = 20;
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const FEEDBACK_DURATION_MS = 1500;

export const COLOR_OPTIONS: PencilColor[] = [
  {
    name: "Kırmızı",
    hex: "#E91E63",
    colorClass: "text-[#E91E63]",
    bgClass: "bg-cyber-pink",
    lightBg: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    name: "Mavi",
    hex: GAME_COLORS.blue,
    colorClass: "text-cyber-blue",
    bgClass: "bg-cyber-blue",
    lightBg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    name: "Yeşil",
    hex: GAME_COLORS.emerald,
    colorClass: "text-cyber-green",
    bgClass: "bg-cyber-green",
    lightBg: "bg-green-50 dark:bg-green-950/30",
  },
  {
    name: "Sarı",
    hex: "#facc15",
    colorClass: "text-cyber-yellow",
    bgClass: "bg-cyber-yellow",
    lightBg: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  {
    name: "Mor",
    hex: GAME_COLORS.purple,
    colorClass: "text-cyber-purple",
    bgClass: "bg-cyber-purple",
    lightBg: "bg-purple-50 dark:bg-purple-950/30",
  },
];
