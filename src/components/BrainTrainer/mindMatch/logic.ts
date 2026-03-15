import { GAME_ID, TOTAL_ITEMS } from "./constants.ts";
import { CATEGORIES } from "./data.ts";
import type {
  EmojiDef,
  PuzzleData,
  PuzzleItem,
  SelectionResult,
} from "./types.ts";

const randomIndex = (length: number, random: () => number) =>
  Math.floor(random() * length);

const randomItem = <T,>(items: readonly T[], random: () => number): T =>
  items[randomIndex(items.length, random)];

export const shuffle = <T,>(items: readonly T[], random: () => number) => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
};

export const getCorrectCountForLevel = (level: number) => {
  if (level <= 5) {
    return 4;
  }

  if (level <= 12) {
    return 5;
  }

  return 6;
};

const createItemId = (index: number, random: () => number) =>
  `${GAME_ID}-${index}-${Math.floor(random() * 1_000_000_000).toString(36)}`;

export const generatePuzzle = (
  level: number,
  random: () => number = Math.random,
): PuzzleData => {
  const categoryKeys = Object.keys(CATEGORIES);
  const categoryKey = randomItem(categoryKeys, random);
  const category = CATEGORIES[categoryKey];
  const correctCount = getCorrectCountForLevel(level);
  const distractorCount = TOTAL_ITEMS - correctCount;
  const selectedTargets = shuffle(category.items, random).slice(0, correctCount);
  const otherItems: EmojiDef[] = [];
  const excludedKeys = category.excludedDistractorKeys || [];

  for (const key of categoryKeys) {
    if (key !== categoryKey && !excludedKeys.includes(key)) {
      otherItems.push(...CATEGORIES[key].items);
    }
  }

  const selectedDistractors = shuffle(otherItems, random).slice(
    0,
    distractorCount,
  );

  const items: PuzzleItem[] = shuffle(
    [
      ...selectedTargets.map((item) => ({ ...item, isMatch: true })),
      ...selectedDistractors.map((item) => ({ ...item, isMatch: false })),
    ],
    random,
  ).map((item, index) => ({
    ...item,
    id: createItemId(index, random),
  }));

  return {
    category: categoryKey,
    description: category.description,
    items,
  };
};

export const toggleSelectedId = (selectedIds: Set<string>, id: string) => {
  const next = new Set(selectedIds);

  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }

  return next;
};

export const evaluatePuzzleSelection = (
  puzzle: PuzzleData,
  selectedIds: Set<string>,
): SelectionResult => {
  const correctIds = puzzle.items
    .filter((item) => item.isMatch)
    .map((item) => item.id);
  const correctIdSet = new Set(correctIds);
  const missedIds = correctIds.filter((id) => !selectedIds.has(id));
  const wrongIds = Array.from(selectedIds).filter((id) => !correctIdSet.has(id));

  return {
    isCorrect: missedIds.length === 0 && wrongIds.length === 0,
    correctIds,
    missedIds,
    wrongIds,
  };
};

export const calculateMindMatchScore = (level: number) => 10 * level;
