import { MAX_LEVEL } from "./constants.ts";
import type { ReflectionRound } from "./types.ts";

type RandomFn = () => number;

export const getSequenceLength = (level: number) =>
  Math.min(10, 4 + Math.floor(level / 2));

export const generateDigits = (
  level: number,
  random: RandomFn = Math.random,
) =>
  Array.from({ length: getSequenceLength(level) }, () => Math.floor(random() * 9) + 1);

export const shouldMirror = (
  level: number,
  random: RandomFn = Math.random,
) => level > 2 && random() < 0.4;

export const createRound = (
  level: number,
  random: RandomFn = Math.random,
): ReflectionRound => ({
  digits: generateDigits(level, random),
  isMirrored: shouldMirror(level, random),
});

export const getDisplaySpeed = (level: number) =>
  Math.max(600, 1200 - level * 40);

export const getReversedDigits = (digits: number[]) => [...digits].reverse();

export const isNextSequenceDigitCorrect = (
  digits: number[],
  userSequence: number[],
  digit: number,
) => digit === getReversedDigits(digits)[userSequence.length];

export const isSequenceComplete = (digits: number[], userSequenceLength: number) =>
  userSequenceLength >= digits.length;

export const getDigitsSum = (digits: number[]) =>
  digits.reduce((sum, digit) => sum + digit, 0);

export const calculateReflectionSumScore = (level: number, timeLeft: number) =>
  level * 10 + Math.floor(timeLeft / 10);

export const isMaxLevel = (level: number) => level >= MAX_LEVEL;
