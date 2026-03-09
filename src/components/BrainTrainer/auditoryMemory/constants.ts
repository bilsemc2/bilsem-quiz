import { GAME_COLORS } from "../shared/gameColors.ts";
import type { NoteData } from "./types.ts";

export const GAME_ID = "isitsel-hafiza";
export const GAME_TITLE = "İşitsel Hafıza";
export const GAME_DESCRIPTION =
  "Melodileri dikkatle dinle, notaların sırasını aklında tut ve aynı müziği tekrar çalarak hafızanı kanıtla!";
export const TUZO_TEXT = "TUZÖ 5.4.2 İşitsel Melodi Dizisi & Çalışma Belleği";
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1500;
export const NOTE_PLAY_DURATION_MS = 400;
export const USER_NOTE_DURATION_MS = 300;
export const PRE_NOTE_DELAY_MS = 600;
export const POST_SEQUENCE_HOLD_MS = 800;
export const ANSWER_PHASE_DELAY_MS = 400;

export const NOTES: NoteData[] = [
  { name: "Do", frequency: 261.63, color: GAME_COLORS.pink },
  { name: "Re", frequency: 293.66, color: "#FFA07A" },
  { name: "Mi", frequency: 329.63, color: GAME_COLORS.yellow },
  { name: "Fa", frequency: 349.23, color: GAME_COLORS.orange },
  { name: "Sol", frequency: 392.0, color: GAME_COLORS.emerald },
  { name: "La", frequency: 440.0, color: GAME_COLORS.blue },
  { name: "Si", frequency: 493.88, color: GAME_COLORS.purple },
  { name: "Do2", frequency: 523.25, color: "#FB7185" },
];
