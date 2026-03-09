import type { ShapeType } from "./types.ts";

export const GAME_ID = "dikkat-kodlama";
export const GAME_TITLE = "Dikkat Kodlama";
export const GAME_DESCRIPTION =
  "Sayılarla şekilleri eşleştir, zihnindeki kodları en hızlı şekilde çözerek zirveye ulaş!";
export const TUZO_TEXT = "TUZÖ 5.6.1 Dikkat Kodlama & Sembol Eşleştirme";
export const MAX_LEVEL = 20;
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const FEEDBACK_DURATION_MS = 1000;
export const LEVEL_BONUS_SECONDS = 10;

export const ALL_SHAPES: ShapeType[] = [
  "circle",
  "square",
  "triangle",
  "plus",
  "star",
  "diamond",
  "hexagon",
];

export const SHAPE_LABELS: Record<ShapeType, string> = {
  circle: "Daire",
  square: "Kare",
  triangle: "Üçgen",
  plus: "Artı",
  star: "Yıldız",
  diamond: "Elmas",
  hexagon: "Altıgen",
};
