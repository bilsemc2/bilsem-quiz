import { GAME_COLORS } from "../shared/gameColors.ts";
import type { ShapeColor, ShapeType } from "./types";

export const GAME_ID = "mantik-bulmacasi";
export const GAME_TITLE = "Mantık Bulmacası";
export const GAME_DESCRIPTION =
  "Örnek gruplardaki gizli kuralları keşfet ve aynı kurala uyan yeni grubu bul! Analitik düşünme becerini kanıtla.";
export const TUZO_TEXT = "TUZÖ 5.5.1 Kural Çıkarsama";
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1500;
export const OPTION_COUNT = 4;

export const AVAILABLE_SHAPES: readonly ShapeType[] = [
  "circle",
  "square",
  "triangle",
  "pentagon",
  "hexagon",
  "star",
  "diamond",
];

export const AVAILABLE_COLORS: readonly ShapeColor[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "cyan",
];

export const COLORS_MAP: Record<ShapeColor, string> = {
  red: GAME_COLORS.incorrect,
  blue: "#60a5fa",
  green: GAME_COLORS.emerald,
  yellow: GAME_COLORS.yellow,
  purple: GAME_COLORS.purple,
  orange: "#fb923c",
  cyan: "#22d3ee",
};

export const COLOR_LABELS: Record<ShapeColor, string> = {
  red: "Kırmızı",
  blue: "Mavi",
  green: "Yeşil",
  yellow: "Sarı",
  purple: "Mor",
  orange: "Turuncu",
  cyan: "Turkuaz",
};

export const TYPE_LABELS: Record<ShapeType, string> = {
  circle: "Daire",
  square: "Kare",
  triangle: "Üçgen",
  pentagon: "Beşgen",
  hexagon: "Altıgen",
  star: "Yıldız",
  diamond: "Eşkenar Dörtgen",
};
