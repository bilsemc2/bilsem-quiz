import { GAME_COLORS } from "../shared/gameColors.ts";
import type { IconType, LevelConfig } from "./types";

export const GAME_ID = "gorsel-hafiza";
export const GAME_TITLE = "Görsel Hafıza";
export const GAME_DESCRIPTION =
  "Izgaradaki şekilleri hafızanda tut, değişen şekli bul!";
export const TUZO_TEXT = "2.1.2 Görsel Süreli Bellek";
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1500;
export const TRANSITION_DURATION_MS = 600;
export const NEUTRAL_CELL_COLOR = "#6B7280";

export const ICON_TYPES: readonly IconType[] = [
  "Star",
  "Circle",
  "Square",
  "Triangle",
  "Hexagon",
  "Diamond",
  "Heart",
  "Cloud",
  "Sun",
  "Moon",
  "Zap",
  "Anchor",
  "Music",
  "Ghost",
  "Flower",
  "Crown",
];

export const DISPLAY_COLORS = [
  GAME_COLORS.pink,
  GAME_COLORS.emerald,
  GAME_COLORS.blue,
  GAME_COLORS.yellow,
  GAME_COLORS.orange,
  GAME_COLORS.purple,
] as const;

export const LEVEL_CONFIG: Record<number, LevelConfig> = {
  1: { gridSize: 3, items: 3, memorizeMs: 3000 },
  2: { gridSize: 3, items: 3, memorizeMs: 2800 },
  3: { gridSize: 3, items: 4, memorizeMs: 3000 },
  4: { gridSize: 3, items: 5, memorizeMs: 3000 },
  5: { gridSize: 3, items: 5, memorizeMs: 2500 },
  6: { gridSize: 3, items: 6, memorizeMs: 3000 },
  7: { gridSize: 3, items: 7, memorizeMs: 2500 },
  8: { gridSize: 4, items: 6, memorizeMs: 3500 },
  9: { gridSize: 4, items: 7, memorizeMs: 3000 },
  10: { gridSize: 4, items: 8, memorizeMs: 3000 },
  11: { gridSize: 4, items: 9, memorizeMs: 2500 },
  12: { gridSize: 4, items: 9, memorizeMs: 2000 },
  13: { gridSize: 4, items: 10, memorizeMs: 2500 },
  14: { gridSize: 4, items: 11, memorizeMs: 2500 },
  15: { gridSize: 4, items: 12, memorizeMs: 2000 },
  16: { gridSize: 5, items: 10, memorizeMs: 3000 },
  17: { gridSize: 5, items: 12, memorizeMs: 2500 },
  18: { gridSize: 5, items: 13, memorizeMs: 2000 },
  19: { gridSize: 5, items: 14, memorizeMs: 1800 },
  20: { gridSize: 5, items: 15, memorizeMs: 1500 },
};
