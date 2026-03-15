import {
  Circle,
  Diamond,
  Heart,
  Square,
  Star,
  Triangle,
  type LucideIcon,
} from "lucide-react";

import { GAME_COLORS } from "../shared/gameColors.ts";
import type {
  CubeNet,
  FaceName,
  GameOption,
  IconPaletteItem,
  PaletteColor,
} from "./types.ts";

export const GAME_ID = "sihirli-kupler";
export const GAME_TITLE = "Sihirli Küpler";
export const GAME_DESCRIPTION =
  "Küp açınımını zihninde katla ve oluşacak doğru küpü bul! Üç boyutlu düşünme becerini test et.";
export const TUZO_TEXT = "TUZÖ 4.2.1 3B Uzayda Görselleştirme";
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1200;
export const ROUND_TRANSITION_MS = 1500;
export const PREVIEW_CUBE_SIZE = 60;
export const OPTION_CUBE_SIZE = 65;

export const FACE_NAMES: FaceName[] = [
  "FRONT",
  "BACK",
  "LEFT",
  "RIGHT",
  "TOP",
  "BOTTOM",
];

export const COLOR_PALETTE: PaletteColor[] = [
  { name: "Red", hex: GAME_COLORS.pink },
  { name: "Teal", hex: GAME_COLORS.emerald },
  { name: "Yellow", hex: GAME_COLORS.yellow },
  { name: "Orange", hex: GAME_COLORS.orange },
  { name: "Purple", hex: GAME_COLORS.purple },
  { name: "Pink", hex: GAME_COLORS.pink },
];

export const ICON_PALETTE: IconPaletteItem[] = [
  { icon: Square as LucideIcon, name: "Kare" },
  { icon: Circle as LucideIcon, name: "Daire" },
  { icon: Triangle as LucideIcon, name: "Üçgen" },
  { icon: Star as LucideIcon, name: "Yıldız" },
  { icon: Heart as LucideIcon, name: "Kalp" },
  { icon: Diamond as LucideIcon, name: "Baklava" },
];

export const OPTION_ROTATIONS: ReadonlyArray<GameOption> = [
  {
    rotation: { x: -20, y: 35 },
    isCorrect: true,
    id: "correct",
  },
  {
    rotation: { x: 160, y: 45 },
    isCorrect: false,
    id: "w1",
  },
  {
    rotation: { x: 45, y: -160 },
    isCorrect: false,
    id: "w2",
  },
];

export const NET_LAYOUTS: CubeNet[] = [
  {
    name: "1-4-1 (T)",
    grid: [
      [null, "TOP", null, null],
      ["LEFT", "FRONT", "RIGHT", "BACK"],
      [null, "BOTTOM", null, null],
    ],
  },
  {
    name: "1-4-1 (L)",
    grid: [
      ["TOP", null, null, null],
      ["BACK", "RIGHT", "FRONT", "LEFT"],
      [null, null, null, "BOTTOM"],
    ],
  },
  {
    name: "1-4-1 (Z)",
    grid: [
      [null, "TOP", null, null],
      ["BACK", "RIGHT", "FRONT", null],
      [null, null, "LEFT", "BOTTOM"],
    ],
  },
  {
    name: "2-3-1 (A)",
    grid: [
      ["TOP", "BACK", null, null],
      [null, "RIGHT", "FRONT", "LEFT"],
      [null, null, null, "BOTTOM"],
    ],
  },
  {
    name: "2-2-2 (Basamak)",
    grid: [
      ["TOP", "BACK", null],
      [null, "RIGHT", "FRONT"],
      [null, null, "LEFT"],
      [null, null, "BOTTOM"],
    ],
  },
  {
    name: "3-3 (Merdiven)",
    grid: [
      ["TOP", "BACK", "RIGHT", null, null],
      [null, null, "FRONT", "LEFT", "BOTTOM"],
    ],
  },
];
