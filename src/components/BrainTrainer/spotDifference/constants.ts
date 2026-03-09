import { GAME_COLORS } from "../shared/gameColors.ts";
import type { DiffType, ShapeData } from "./types.ts";

export const GAME_ID = "farki-bul";
export const GAME_TITLE = "Farkı Bul";
export const GAME_DESCRIPTION =
  "Bir kare diğerlerinden farklı. Renk, şekil, boyut ve açı ipuçlarını gözlemle, farklı olanı bul.";
export const TUZO_TEXT = "5.7.1 Seçici Dikkat";
export const MAX_LEVEL = 20;
export const TIME_LIMIT = 180;
export const INITIAL_LIVES = 5;
export const FEEDBACK_DURATION_MS = 1500;

export const DIFF_LABELS: Record<DiffType, string> = {
  lightness: "Açıklık",
  hue: "Renk Tonu",
  radius: "Köşe",
  scale: "Boyut",
  rotation: "Açı",
  shape: "Şekil",
};

export const SHAPES: ShapeData[] = [
  { id: "triangle", path: "M50 8 L92 88 L8 88 Z" },
  {
    id: "star",
    path: "M50 6 L62 34 L92 38 L68 56 L76 88 L50 70 L24 88 L32 56 L8 38 L38 34 Z",
  },
  { id: "hex", path: "M26 8 L74 8 L94 50 L74 92 L26 92 L6 50 Z" },
  { id: "kite", path: "M50 6 L88 40 L64 94 L36 94 L12 40 Z" },
  {
    id: "drop",
    path: "M50 6 C70 20 84 40 84 60 C84 80 68 94 50 94 C32 94 16 80 16 60 C16 40 30 20 50 6 Z",
  },
  {
    id: "blob",
    path: "M58 8 C74 10 90 24 92 42 C94 60 86 80 68 88 C50 96 30 92 18 78 C6 64 4 44 16 28 C28 12 42 6 58 8 Z",
  },
  { id: "diamond", path: "M50 4 L94 50 L50 96 L6 50 Z" },
  {
    id: "octagon",
    path: "M30 6 L70 6 L94 30 L94 70 L70 94 L30 94 L6 70 L6 30 Z",
  },
  { id: "hourglass", path: "M18 10 L82 10 L60 50 L82 90 L18 90 L40 50 Z" },
  {
    id: "chevron",
    path: "M8 32 L50 8 L92 32 L70 54 L92 76 L50 92 L8 76 L30 54 Z",
  },
  {
    id: "leaf",
    path: "M14 68 C24 38 48 16 72 14 C90 12 94 28 88 46 C80 74 52 92 28 88 C16 86 10 80 14 68 Z",
  },
  {
    id: "wave",
    path: "M8 60 C22 40 40 40 52 54 C64 68 82 68 92 50 C86 78 66 92 44 90 C24 88 10 78 8 60 Z",
  },
];

export const GHOST_PATH =
  "M60 12 C78 14 92 30 90 48 C88 66 72 82 54 88 C36 94 16 88 10 70 C4 52 10 30 26 20 C40 10 46 10 60 12 Z";

export const ACTIVE_TIME_BAR_COLOR = GAME_COLORS.blue;
export const WARNING_TIME_BAR_COLOR = GAME_COLORS.pink;
