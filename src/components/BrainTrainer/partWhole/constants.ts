import { GAME_COLORS } from "../shared/gameColors.ts";
import type { PatternType } from "./types.ts";

export const GAME_ID = "parca-butun";
export const GAME_TITLE = "Parca Butun";
export const GAME_DESCRIPTION =
  "Buyuk desendeki eksik parcayi bul ve gorsel algini test et. Renklerin ve desenlerin uyumuna dikkat et.";
export const TUZO_TEXT = "TUZO 4.2.1 Parca-Butun Iliskileri";

export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const SVG_SIZE = 300;
export const PIECE_SIZE = 100;
export const FEEDBACK_DURATION_MS = 1200;
export const SKIP_PENALTY = -50;

export const PATTERN_COLORS = [...GAME_COLORS.shapes];

export const PATTERN_TYPES: PatternType[] = [
  "dots",
  "stripes",
  "zigzag",
  "waves",
  "checkerboard",
  "crosshatch",
  "star",
  "polygon",
  "scribble",
  "burst",
];
