import {
  DISPLAY_COLORS,
  ICON_TYPES,
  LEVEL_CONFIG,
  MAX_LEVEL,
  NEUTRAL_CELL_COLOR,
} from "./constants.ts";
import type { GridCell, VisualMemoryRound } from "./types.ts";

const pickRandom = <T,>(items: readonly T[], random: () => number) =>
  items[Math.floor(random() * items.length)];

export const shuffle = <T,>(items: readonly T[], random: () => number) => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
};

export const getLevelConfig = (level: number) =>
  LEVEL_CONFIG[level] ?? LEVEL_CONFIG[MAX_LEVEL];

export const generateGrid = (
  gridSize: number,
  itemCount: number,
  random: () => number = Math.random,
): GridCell[] => {
  const cells: GridCell[] = Array.from({ length: gridSize * gridSize }, (_, index) => ({
    id: `c-${index}`,
    icon: null,
    color: NEUTRAL_CELL_COLOR,
  }));

  const activeIndexes = shuffle(
    Array.from({ length: gridSize * gridSize }, (_, index) => index),
    random,
  ).slice(0, itemCount);

  for (const index of activeIndexes) {
    cells[index] = {
      ...cells[index],
      icon: pickRandom(ICON_TYPES, random),
      color: pickRandom(DISPLAY_COLORS, random),
    };
  }

  return cells;
};

export const createModifiedGrid = (
  originalGrid: GridCell[],
  random: () => number = Math.random,
) => {
  const updatedGrid = originalGrid.map((cell) => ({ ...cell }));
  const activeIndexes = updatedGrid
    .map((cell, index) => (cell.icon ? index : -1))
    .filter((index) => index !== -1);
  const targetIndex = pickRandom(activeIndexes, random);
  const previousIcon = updatedGrid[targetIndex].icon;
  let nextIcon = pickRandom(ICON_TYPES, random);

  while (nextIcon === previousIcon) {
    nextIcon = pickRandom(ICON_TYPES, random);
  }

  updatedGrid[targetIndex] = {
    ...updatedGrid[targetIndex],
    icon: nextIcon,
    color: pickRandom(DISPLAY_COLORS, random),
  };

  return {
    grid: updatedGrid,
    targetCellId: updatedGrid[targetIndex].id,
  };
};

export const createRound = (
  level: number,
  random: () => number = Math.random,
): VisualMemoryRound => {
  const config = getLevelConfig(level);
  const gridBefore = generateGrid(config.gridSize, config.items, random);
  const { grid: gridAfter, targetCellId } = createModifiedGrid(
    gridBefore,
    random,
  );

  return {
    gridSize: config.gridSize,
    memorizeMs: config.memorizeMs,
    gridBefore,
    gridAfter,
    targetCellId,
  };
};

export const calculateVisualMemoryScore = (level: number) => 15 * level;
