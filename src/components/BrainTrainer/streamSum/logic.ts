import { MAX_LEVEL, VICTORY_STREAK_TARGET } from "./constants.ts";

export const getAnswerTime = (level: number) => {
  return Math.max(3000, 6000 - level * 150);
};

export const generateNumber = (randomFn: () => number = Math.random) => {
  return Math.floor(randomFn() * 9) + 1;
};

export const getExpectedTotal = (previous: number, current: number) => {
  return previous + current;
};

export const evaluateInput = (input: string, expected: number) => {
  if (Number(input) === expected) {
    return "correct";
  }

  if (input.length >= expected.toString().length) {
    return "wrong";
  }

  return "partial";
};

export const calculateStreamSumScore = (level: number, streak: number) => {
  return level * 50 + streak * 10;
};

export const shouldAdvanceLevel = (nextStreak: number, level: number) => {
  return nextStreak % 5 === 0 && level < MAX_LEVEL;
};

export const shouldTriggerVictory = (level: number, streak: number) => {
  return level >= MAX_LEVEL && streak >= VICTORY_STREAK_TARGET;
};

export const buildStreamSumFeedbackMessage = ({
  isCorrect,
  level,
  maxLevel,
  expected,
}: {
  isCorrect: boolean;
  level: number;
  maxLevel: number;
  expected: number | null;
}): string => {
  if (isCorrect) {
    if (level >= maxLevel) return "Harika! Son seviyeyi de geçtin!";
    return `Doğru! Akış devam ediyor.`;
  }
  if (expected !== null) return `Yanlış! Doğru toplam: ${expected}`;
  return "Süre doldu! Daha hızlı topla.";
};
