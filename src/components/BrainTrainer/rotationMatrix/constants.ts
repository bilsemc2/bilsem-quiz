import { GAME_COLORS } from "../shared/gameColors.ts";

export const GAME_ID = "rotasyon-matrisi";
export const GAME_TITLE = "Rotasyon Matrisi";
export const GAME_DESCRIPTION =
  "Şekillerin dönüş kuralını keşfet ve eksik parçayı bul. Uzamsal zekanı galaksiler arası bir teste sok.";
export const TUZO_TEXT = "TUZÖ 4.1.1 Uzamsal Akıl Yürütme";
export const MAX_LEVEL = 20;
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const FEEDBACK_DURATION_MS = 1500;
export const MATRIX_SIZE = 9;
export const ROTATION_STEPS = [45, 90, 135] as const;
export const OPTION_ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315] as const;

export const SHAPE_COLORS = [
  GAME_COLORS.pink,
  GAME_COLORS.emerald,
  GAME_COLORS.yellow,
  GAME_COLORS.orange,
  GAME_COLORS.purple,
  "#55E6C1",
  GAME_COLORS.pink,
  "#FAB1A0",
  "#00D2D3",
  "#54A0FF",
] as const;

export const OPTION_BADGE_CLASSES = [
  "bg-cyber-pink",
  "bg-cyber-blue",
  "bg-cyber-green",
  "bg-cyber-yellow",
] as const;
