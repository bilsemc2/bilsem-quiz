import { MAX_LEVEL } from "./constants.ts";
import type { CosmicMemoryRound, GameMode } from "./types.ts";

export const getGridSize = (level: number) => {
  if (level <= 5) {
    return 3;
  }

  if (level <= 12) {
    return 4;
  }

  return 5;
};

export const getSequenceLength = (level: number) => {
  return 2 + Math.floor(level / 2.5);
};

export const getDisplayTime = (level: number) => {
  return Math.max(400, 1000 - level * 40);
};

export const getPauseTime = (level: number) => {
  return Math.max(200, 400 - level * 20);
};

export const pickGameMode = (level: number, randomValue = Math.random()) => {
  if (level <= 7) {
    return "NORMAL";
  }

  return randomValue > 0.5 ? "REVERSE" : "NORMAL";
};

export const generateSequence = (
  level: number,
  gridSize: number,
  randomFn: () => number = Math.random,
) => {
  return Array.from({ length: getSequenceLength(level) }, () =>
    Math.floor(randomFn() * (gridSize * gridSize)),
  );
};

export const createRound = (
  level: number,
  randomFn: () => number = Math.random,
): CosmicMemoryRound => {
  const gridSize = getGridSize(level);

  return {
    sequence: generateSequence(level, gridSize, randomFn),
    gridSize,
    mode: pickGameMode(level, randomFn()),
  };
};

export const getExpectedCell = (
  sequence: number[],
  currentStep: number,
  mode: GameMode,
) => {
  if (mode === "REVERSE") {
    return sequence[sequence.length - 1 - currentStep];
  }

  return sequence[currentStep];
};

export const isSequenceComplete = (
  sequence: number[],
  userSequenceLength: number,
) => {
  return userSequenceLength === sequence.length;
};

export const calculateCosmicMemoryScore = (level: number) => {
  return 10 * level;
};

export const isMaxLevel = (level: number) => {
  return level >= MAX_LEVEL;
};
