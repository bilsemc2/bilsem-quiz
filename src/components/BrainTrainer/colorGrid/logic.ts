import { GAME_COLORS } from "../shared/gameColors.ts";

export const GAME_ID = "renk-sekans";
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1200;

export interface ColorDef {
  id: string;
  name: string;
  hex: string;
}

export interface SequenceStep {
  cellId: number;
  colorId: string;
}

export const COLORS: ColorDef[] = [
  { id: "red", name: "Kırmızı", hex: "#FF6B6B" },
  { id: "blue", name: "Mavi", hex: "#4ECDC4" },
  { id: "yellow", name: "Sarı", hex: GAME_COLORS.yellow },
  { id: "green", name: "Yeşil", hex: GAME_COLORS.emerald },
  { id: "purple", name: "Mor", hex: "#9B59B6" },
];

export type LocalPhase = "showing" | "playing" | "feedback";

export const generateSequence = (
  level: number,
  random: () => number = Math.random,
): SequenceStep[] => {
  const count = level + 1;
  const newSeq: SequenceStep[] = [];
  for (let i = 0; i < count; i++) {
    newSeq.push({
      cellId: Math.floor(random() * 9),
      colorId: COLORS[Math.floor(random() * COLORS.length)].id,
    });
  }
  return newSeq;
};

export const getDisplayTime = (level: number): number =>
  Math.max(300, 1000 - level * 30);

export const getDelayTime = (level: number): number =>
  Math.max(100, 400 - level * 10);

export const checkStep = (
  cellId: number,
  sequence: readonly SequenceStep[],
  currentStepIndex: number,
): boolean => cellId === sequence[currentStepIndex].cellId;

export const isSequenceComplete = (
  userStepCount: number,
  sequenceLength: number,
): boolean => userStepCount === sequenceLength;

export const computeScore = (level: number): number => level * 50;

export const getColorById = (colorId: string): ColorDef | undefined =>
  COLORS.find((c) => c.id === colorId);
