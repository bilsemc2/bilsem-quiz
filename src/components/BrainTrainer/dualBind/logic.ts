import {
  ANSWER_RESULT_DELAY_MS,
  COLOR_OPTIONS,
  MAX_LEVEL,
  SYMBOLS,
} from "./constants.ts";
import type {
  DualBindQuestion,
  DualBindRound,
  SymbolColor,
} from "./types.ts";

const shuffleArray = <T>(items: T[], randomFn: () => number) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const getPairCountForLevel = (level: number) => {
  if (level <= 5) {
    return 3;
  }

  if (level <= 12) {
    return 4;
  }

  return 5;
};

export const getMemorizeCountdown = (level: number) => {
  return Math.max(3, 7 - Math.floor(level / 4));
};

export const getAnswerResultDelay = () => {
  return ANSWER_RESULT_DELAY_MS;
};

export const createSymbolColors = (
  level: number,
  randomFn: () => number = Math.random,
): SymbolColor[] => {
  const pairCount = getPairCountForLevel(level);
  const shuffledSymbols = shuffleArray([...SYMBOLS], randomFn).slice(0, pairCount);
  const shuffledColors = shuffleArray([...COLOR_OPTIONS], randomFn).slice(0, pairCount);

  return shuffledSymbols.map((symbol, index) => ({
    color: shuffledColors[index]!.hex,
    colorName: shuffledColors[index]!.name,
    symbol,
  }));
};

const createColorToSymbolQuestion = (
  targetPair: SymbolColor,
  otherPairs: SymbolColor[],
  randomFn: () => number,
): DualBindQuestion => {
  return {
    correctAnswer: targetPair.symbol,
    hint: targetPair.color,
    options: shuffleArray(
      [targetPair.symbol, ...otherPairs.map((pair) => pair.symbol).slice(0, 3)],
      randomFn,
    ),
    query: "Bu renkteki şekil hangisiydi?",
    type: "color-to-symbol",
  };
};

const createSymbolToColorQuestion = (
  targetPair: SymbolColor,
  otherPairs: SymbolColor[],
  randomFn: () => number,
): DualBindQuestion => {
  return {
    correctAnswer: targetPair.colorName,
    hint: targetPair.symbol,
    options: shuffleArray(
      [targetPair.colorName, ...otherPairs.map((pair) => pair.colorName).slice(0, 3)],
      randomFn,
    ),
    query: "Bu şekil hangi renkteydi?",
    type: "symbol-to-color",
  };
};

export const createDualQuestions = (
  pairs: SymbolColor[],
  randomFn: () => number = Math.random,
): DualBindQuestion[] => {
  const targetPair = pairs[Math.floor(randomFn() * pairs.length)];

  if (!targetPair) {
    return [];
  }

  const otherPairs = pairs.filter((pair) => pair !== targetPair);

  return [
    createColorToSymbolQuestion(targetPair, otherPairs, randomFn),
    createSymbolToColorQuestion(targetPair, otherPairs, randomFn),
  ];
};

export const createRound = (
  level: number,
  randomFn: () => number = Math.random,
): DualBindRound => {
  const symbolColors = createSymbolColors(level, randomFn);

  return {
    countdown: getMemorizeCountdown(level),
    questions: createDualQuestions(symbolColors, randomFn),
    symbolColors,
  };
};

export const getColorHexByName = (name: string) => {
  return COLOR_OPTIONS.find((color) => color.name === name)?.hex ?? null;
};

export const calculateDualBindScore = (level: number, streak: number) => {
  return 10 * level + streak * 5;
};

export const isMaxLevel = (level: number) => {
  return level >= MAX_LEVEL;
};
