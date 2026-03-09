import { ALL_SYMBOLS, GRID_SIZE } from "./constants.ts";
import type {
  CellData,
  CellSelectionResult,
  VisualScanningRound,
} from "./types.ts";

type RandomFn = () => number;

const shuffleItems = <T>(items: readonly T[], random: RandomFn) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const getTargetCountForLevel = (level: number) =>
  level < 3 ? 6 : level < 6 ? 8 : level < 10 ? 10 : level < 15 ? 12 : 14;

export const getDistractorCountForLevel = (level: number) =>
  level < 5 ? 3 : level < 10 ? 5 : level < 15 ? 7 : 10;

export const createLevelGrid = (
  targetSymbol: string,
  level: number,
  random: RandomFn = Math.random,
): CellData[] => {
  const targetCount = getTargetCountForLevel(level);
  const distractorCount = getDistractorCountForLevel(level);
  const distractors = shuffleItems(
    ALL_SYMBOLS.filter((symbol) => symbol !== targetSymbol),
    random,
  ).slice(0, distractorCount);
  const targetPositions = new Set<number>();
  const cells: CellData[] = [];

  while (targetPositions.size < targetCount) {
    targetPositions.add(Math.floor(random() * GRID_SIZE));
  }

  for (let index = 0; index < GRID_SIZE; index += 1) {
    const isTarget = targetPositions.has(index);

    cells.push({
      symbol: isTarget
        ? targetSymbol
        : distractors[Math.floor(random() * distractors.length)],
      isTarget,
      isClicked: false,
      isWrongClick: false,
    });
  }

  return cells;
};

export const createRound = (
  level: number,
  random: RandomFn = Math.random,
): VisualScanningRound => {
  const targetSymbol =
    ALL_SYMBOLS[Math.floor(random() * ALL_SYMBOLS.length)] ?? ALL_SYMBOLS[0];

  return {
    targetSymbol,
    cells: createLevelGrid(targetSymbol, level, random),
  };
};

export const getRemainingTargetCount = (cells: readonly CellData[]) =>
  cells.filter((cell) => cell.isTarget && !cell.isClicked).length;

export const applyCellSelection = (
  cells: readonly CellData[],
  index: number,
): CellSelectionResult => {
  const cell = cells[index];

  if (!cell || cell.isClicked || cell.isWrongClick) {
    return {
      nextCells: [...cells],
      isCorrect: false,
      isIgnored: true,
    };
  }

  const nextCells = [...cells];
  nextCells[index] = cell.isTarget
    ? { ...cell, isClicked: true }
    : { ...cell, isWrongClick: true };

  return {
    nextCells,
    isCorrect: cell.isTarget,
    isIgnored: false,
  };
};

export const calculateVisualScanningScore = (currentStreak: number) =>
  25 + Math.min(currentStreak * 2, 20);
