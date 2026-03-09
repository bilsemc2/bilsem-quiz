import { GAME_COLORS } from "../shared/gameColors.ts";
import type { ColorType, ShapeType } from "./types.ts";

export const GAME_ID = "kosullu-yonerge";
export const GAME_TITLE = "Koşullu Yönerge";
export const GAME_DESCRIPTION =
  "Verilen mantıksal koşulu dikkatle oku, sahnedeki nesneleri analiz et ve doğru hedefi seç!";
export const TUZO_TEXT =
  "TUZÖ 5.2.1 Mantıksal Akıl Yürütme ve Koşullu Yönerge Takibi";
export const MAX_LEVEL = 20;
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const FEEDBACK_DURATION_MS = 1000;
export const ROUND_RESOLVE_DELAY_MS = 1200;

export const SHAPES: ShapeType[] = [
  "Circle",
  "Square",
  "Triangle",
  "Star",
  "Diamond",
];
export const COLORS: ColorType[] = [
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Purple",
];

export const SHAPE_NAMES: Record<ShapeType, string> = {
  Circle: "Daire",
  Square: "Kare",
  Triangle: "Üçgen",
  Star: "Yıldız",
  Diamond: "Elmas",
};

export const COLOR_NAMES: Record<ColorType, string> = {
  Red: "Kırmızı",
  Blue: "Mavi",
  Green: "Yeşil",
  Yellow: "Sarı",
  Purple: "Mor",
};

export const COLOR_VALUES: Record<ColorType, string> = {
  Red: GAME_COLORS.incorrect,
  Blue: GAME_COLORS.blue,
  Green: GAME_COLORS.emerald,
  Yellow: GAME_COLORS.yellow,
  Purple: GAME_COLORS.purple,
};
