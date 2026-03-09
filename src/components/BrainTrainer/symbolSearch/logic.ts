import { MAX_LEVEL } from "./constants.ts";
import { ICONS } from "./data.ts";
import type { GameIcon, RoundData } from "./types.ts";

type RandomFn = () => number;

export const shuffleItems = <T,>(items: readonly T[], random: RandomFn = Math.random) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const getGroupSize = (level: number) => {
  if (level > 15) {
    return 20;
  }
  if (level > 10) {
    return 15;
  }
  if (level > 5) {
    return 9;
  }
  return 5;
};

export const createRound = (
  level: number,
  random: RandomFn = Math.random,
): RoundData => {
  const groupSize = getGroupSize(level);
  const shuffledIcons = shuffleItems(ICONS, random);
  const target = shuffledIcons[0] ?? ICONS[0];
  const distractors = shuffledIcons.slice(1, groupSize + 2);
  const hasTarget = random() > 0.5;

  const group = hasTarget
    ? shuffleItems([target, ...distractors.slice(0, groupSize - 1)], random)
    : shuffleItems(distractors.slice(0, groupSize), random);

  return {
    group,
    hasTarget,
    target,
  };
};

export const isCorrectAnswer = (userAnswer: boolean, round: RoundData) =>
  userAnswer === round.hasTarget;

export const calculateSymbolSearchScore = (level: number) => 10 * level;

export const isMaxLevel = (level: number) => level >= MAX_LEVEL;

export const hasTargetInGroup = (round: RoundData) =>
  round.group.some((icon) => icon.id === round.target.id);

export const getFeedbackAccent = (
  icon: GameIcon,
  round: RoundData,
  feedbackCorrect: boolean | null,
  isSelected: boolean,
) => {
  if (feedbackCorrect && icon.id === round.target.id) {
    return "success";
  }

  if (feedbackCorrect !== null && isSelected) {
    return "selected";
  }

  if (feedbackCorrect !== null) {
    return "muted";
  }

  return "default";
};
