import { GAME_COLORS } from "../shared/gameColors.ts";
import type { ColorType, ShapeType } from "./types.ts";

export const GAME_ID = "sekil-cebiri";
export const GAME_TITLE = "Şekil Cebiri";
export const GAME_DESCRIPTION =
  "Şekillerin gizli sayısal değerlerini bul, görsel denklemleri çöz ve matematik dehası olduğunu kanıtla.";
export const TUZO_TEXT = "5.5.2 Kural Çıkarsama";
export const MAX_LEVEL = 20;
export const TIME_LIMIT = 180;
export const INITIAL_LIVES = 5;
export const FEEDBACK_DURATION_MS = 1200;
export const MAX_ANSWER_LENGTH = 3;

export const SHAPES: ShapeType[] = [
  "circle",
  "square",
  "triangle",
  "star",
  "hexagon",
  "diamond",
];

export const COLORS: ColorType[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "pink",
  "cyan",
];

export const COLOR_MAP: Record<ColorType, string> = {
  red: GAME_COLORS.pink,
  blue: GAME_COLORS.blue,
  green: GAME_COLORS.emerald,
  yellow: GAME_COLORS.yellow,
  purple: "#b82aff",
  orange: GAME_COLORS.orange,
  pink: GAME_COLORS.pink,
  cyan: GAME_COLORS.blue,
};
