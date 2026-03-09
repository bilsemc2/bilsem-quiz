import { GAME_COLORS } from "../shared/gameColors.ts";
import type {
  CreatureAccessory,
  CreatureColor,
  CreatureEmotion,
  CreatureShape,
} from "./types.ts";

export const GAME_ID = "yaratik-mantigi";
export const GAME_TITLE = "Yaratık Mantığı";
export const GAME_DESCRIPTION =
  "Yaramaz yaratıkları özelliklerine göre grupla! Mantık yönergesini oku ve şartları sağlayan tüm yaratıkları seç.";
export const TUZO_TEXT = "TUZÖ 5.5.3 Yönerge Takibi";
export const MAX_LEVEL = 20;
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const FEEDBACK_DURATION_MS = 1200;

export const ALL_COLORS: CreatureColor[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
];
export const ALL_SHAPES: CreatureShape[] = [
  "fluff",
  "slime",
  "block",
  "spiky",
];
export const ALL_ACCESSORIES: CreatureAccessory[] = [
  "none",
  "hat",
  "glasses",
  "bowtie",
  "crown",
];
export const ALL_EMOTIONS: CreatureEmotion[] = [
  "happy",
  "sad",
  "surprised",
  "sleepy",
  "angry",
];

export const COLOR_VALUES: Record<CreatureColor, string> = {
  red: GAME_COLORS.incorrect,
  blue: GAME_COLORS.blue,
  green: GAME_COLORS.emerald,
  yellow: GAME_COLORS.orange,
  purple: GAME_COLORS.purple,
};

export const STROKE_VALUES: Record<CreatureColor, string> = {
  red: "#991b1b",
  blue: GAME_COLORS.blue,
  green: "#166534",
  yellow: "#b45309",
  purple: "#6d28d9",
};

export const TR = {
  colors: {
    red: "kırmızı",
    blue: "mavi",
    green: "yeşil",
    yellow: "sarı",
    purple: "mor",
  } as Record<CreatureColor, string>,
  colorsAcc: {
    red: "kırmızıları",
    blue: "mavileri",
    green: "yeşilleri",
    yellow: "sarıları",
    purple: "morları",
  } as Record<CreatureColor, string>,
  shapes: {
    fluff: "pofuduk",
    slime: "jöle",
    block: "köşeli",
    spiky: "dikenli",
  } as Record<CreatureShape, string>,
  accessories: {
    none: "aksesuarsız",
    hat: "şapkalı",
    glasses: "gözlüklü",
    bowtie: "papyonlu",
    crown: "taçlı",
  } as Record<CreatureAccessory, string>,
  emotions: {
    happy: "mutlu",
    sad: "üzgün",
    surprised: "şaşkın",
    sleepy: "uykulu",
    angry: "kızgın",
  } as Record<CreatureEmotion, string>,
};
