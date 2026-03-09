import { GAP_SIZE, PATTERN_COLORS, PATTERN_TYPES } from "./constants.ts";
import type {
  PaintingGrid,
  PatternPainterLevel,
  PatternType,
} from "./types.ts";

type RandomFn = () => number;

const randInt = (random: RandomFn, min: number, max: number) =>
  Math.floor(random() * (max - min + 1)) + min;

const shuffle = <T,>(items: T[], random: RandomFn): T[] => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randInt(random, 0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const getCenterCoords = (size: number) =>
  size % 2 === 0 ? [size / 2 - 1, size / 2] : [Math.floor(size / 2)];

const getChebyshevToNearestCenter = (size: number, row: number, column: number) =>
  Math.min(
    ...getCenterCoords(size).flatMap((centerRow) =>
      getCenterCoords(size).map((centerColumn) =>
        Math.max(Math.abs(row - centerRow), Math.abs(column - centerColumn)),
      ),
    ),
  );

export const getGridSizeForLevel = (level: number) => {
  if (level <= 5) {
    return 6;
  }

  if (level <= 10) {
    return 7;
  }

  if (level <= 15) {
    return 8;
  }

  return 9;
};

export const getPatternTypeForLevel = (level: number): PatternType =>
  PATTERN_TYPES[(level - 1) % PATTERN_TYPES.length];

export const createEmptyPainting = (gapSize = GAP_SIZE): PaintingGrid =>
  Array.from({ length: gapSize }, () =>
    Array.from({ length: gapSize }, () => null as string | null),
  );

export const generatePattern = (
  size: number,
  patternType: PatternType,
  random: RandomFn = Math.random,
) => {
  const palette = shuffle(PATTERN_COLORS, random).slice(0, 4);
  const grid = Array.from({ length: size }, () => Array(size).fill(""));

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      switch (patternType) {
        case "checkered":
          grid[row][column] = palette[(row + column) % 2];
          break;
        case "stripes":
          grid[row][column] = palette[row % 2];
          break;
        case "diagonal":
          grid[row][column] = palette[(row + column) % palette.length];
          break;
        case "center-out": {
          const distance = getChebyshevToNearestCenter(size, row, column);
          grid[row][column] = palette[distance % palette.length];
          break;
        }
        case "random-repeating": {
          const blockRow = Math.floor(row / GAP_SIZE);
          const blockColumn = Math.floor(column / GAP_SIZE);
          grid[row][column] = palette[(blockRow + blockColumn) % palette.length];
          break;
        }
      }
    }
  }

  return grid;
};

export const createLevel = (
  level: number,
  random: RandomFn = Math.random,
): PatternPainterLevel => {
  const size = getGridSizeForLevel(level);
  const patternType = getPatternTypeForLevel(level);
  const grid = generatePattern(size, patternType, random);
  const fullRangeStartMax = size - GAP_SIZE;
  const interiorStartMax = size - GAP_SIZE - 1;
  const hasInteriorRange = interiorStartMax >= 1;
  const gapRow = hasInteriorRange
    ? randInt(random, 1, interiorStartMax)
    : randInt(random, 0, fullRangeStartMax);
  const gapColumn = hasInteriorRange
    ? randInt(random, 1, interiorStartMax)
    : randInt(random, 0, fullRangeStartMax);

  return {
    size,
    patternType,
    gapPos: { row: gapRow, column: gapColumn },
    grid,
    correctOption: Array.from({ length: GAP_SIZE }, (_, row) =>
      Array.from(
        { length: GAP_SIZE },
        (_, column) => grid[gapRow + row][gapColumn + column],
      ),
    ),
  };
};

export const getAvailableColors = (grid: string[][]) =>
  Array.from(new Set(grid.flat()));

export const paintTile = (
  painting: PaintingGrid,
  row: number,
  column: number,
  color: string,
) => {
  const nextPainting = painting.map((paintingRow) => [...paintingRow]);
  nextPainting[row][column] = color;
  return nextPainting;
};

export const isPaintingComplete = (painting: PaintingGrid) =>
  painting.every((row) => row.every((cell) => cell !== null));

export const isPaintingCorrect = (
  painting: PaintingGrid,
  correctOption: string[][],
) => {
  if (painting.length !== correctOption.length) {
    return false;
  }

  return painting.every((row, rowIndex) =>
    row.every(
      (cell, columnIndex) => cell === correctOption[rowIndex]?.[columnIndex],
    ),
  );
};

export const getPatternPainterScore = (level: number) => level * 10;
