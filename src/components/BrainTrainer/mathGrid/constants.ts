export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const GAME_ID = "matematik-grid";
export const GAME_TITLE = "Matematik Grid";
export const GAME_DESCRIPTION =
  "3x3 tablodaki gizli sayilari bul! Satirlar arasindaki matematiksel bagi kesfet ve bosluklari doldur.";
export const TUZO_TEXT = "TUZO 5.2.1 Sayisal Akil Yurutme";

export const FEEDBACK_DURATION_MS = 1200;
export const MAX_INPUT_LENGTH = 3;

export const NUMBER_PAD_BUTTONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, "DEL", 0, "CHECK"] as const;

export type NumberPadButton = (typeof NUMBER_PAD_BUTTONS)[number];
