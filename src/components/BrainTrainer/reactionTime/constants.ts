import { GAME_COLORS } from "../shared/gameColors.ts";
import type { ReactionColorOption } from "./types.ts";

export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const GAME_ID = "tepki-suresi";
export const TARGET_COLOR = "green";
export const REACTION_TUZO_CODE = "TUZÖ 8.1.1 Tepki Hızı";

export const REACTION_COLORS: ReactionColorOption[] = [
  {
    name: "Yeşil",
    value: "green",
    hex: GAME_COLORS.emerald,
    className: "bg-cyber-green",
  },
  {
    name: "Kırmızı",
    value: "red",
    hex: GAME_COLORS.incorrect,
    className: "bg-cyber-pink",
  },
  {
    name: "Mavi",
    value: "blue",
    hex: GAME_COLORS.blue,
    className: "bg-cyber-blue",
  },
  {
    name: "Sarı",
    value: "yellow",
    hex: GAME_COLORS.yellow,
    className: "bg-cyber-yellow",
  },
];
