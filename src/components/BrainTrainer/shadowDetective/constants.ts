import type { ShapeId } from "./types";
import { GAME_COLORS } from "../shared/gameColors.ts";

export const GAME_ID = "golge-dedektifi";
export const GAME_TITLE = "Gölge Dedektifi";
export const GAME_DESCRIPTION =
  "Şekilleri incele, zihninde kopyala ve benzerleri arasından gerçeği bul. Görsel analiz yeteneğini zirveye taşır.";
export const TUZO_TEXT = "TUZÖ 5.3.2 Görsel Analiz";
export const TIME_LIMIT = 180;
export const INITIAL_LIVES = 5;
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1200;
export const PREVIEW_SECONDS = 3;
export const OPTION_COUNT = 4;

export const PATTERN_COLORS = [
  GAME_COLORS.pink,
  GAME_COLORS.blue,
  GAME_COLORS.yellow,
  "#00FF66",
  "#9D4EDD",
  "#FF9900",
  "#FFFFFF",
  "#FF69B4",
] as const;

export const SHAPE_IDS: readonly ShapeId[] = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "star",
  "octagon",
  "cross",
  "moon",
  "heart",
];

export const SYMMETRIC_SHAPE_IDS = new Set<ShapeId>([
  "circle",
  "square",
  "star",
  "octagon",
  "cross",
]);
