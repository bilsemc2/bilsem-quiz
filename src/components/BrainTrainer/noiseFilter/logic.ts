import { sounds, type SoundItem } from "../noiseFilterData.ts";
import { NUMBER_OF_OPTIONS } from "./constants.ts";
import type { NoiseFilterRound } from "./types.ts";

type RandomFn = () => number;

const shuffleItems = <T>(items: readonly T[], random: RandomFn) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const pickRandomItem = <T>(items: readonly T[], random: RandomFn) => {
  if (items.length === 0) {
    return null;
  }

  return items[Math.floor(random() * items.length)] ?? null;
};

export const getOptionCountForLevel = (
  level: number,
  maxOptionCount = NUMBER_OF_OPTIONS,
) => {
  const safeLevel = Math.max(1, Math.floor(level));
  const clampedMaxOptionCount = Math.max(2, Math.floor(maxOptionCount));

  return Math.min(clampedMaxOptionCount, Math.max(4, safeLevel + 3));
};

export const createRound = (
  level = 1,
  soundPool: readonly SoundItem[] = sounds,
  random: RandomFn = Math.random,
  maxOptionCount = NUMBER_OF_OPTIONS,
): NoiseFilterRound | null => {
  const targetSound = pickRandomItem(soundPool, random);

  if (!targetSound) {
    return null;
  }

  const optionCount = Math.min(
    soundPool.length,
    getOptionCountForLevel(level, maxOptionCount),
  );

  const distractors = shuffleItems(
    soundPool.filter((sound) => sound.name !== targetSound.name),
    random,
  ).slice(0, Math.max(optionCount - 1, 0));

  return {
    targetSound,
    options: shuffleItems([targetSound, ...distractors], random),
  };
};

export const calculateNoiseFilterScore = (level: number) => 20 * level;

export const isAnswerCorrect = (
  selectedName: string,
  round: NoiseFilterRound | null,
) => selectedName === round?.targetSound.name;

export interface ResolveNoiseFilterSelectionInput {
  selectedName: string;
  round: NoiseFilterRound | null;
  level: number;
  lives: number;
}

export interface NoiseFilterSelectionResolution {
  isCorrect: boolean;
  scoreDelta: number;
  shouldAdvanceLevel: boolean;
  shouldLoseLife: boolean;
  shouldRetryLevel: boolean;
  shouldEndGame: boolean;
}

export const resolveNoiseFilterSelection = ({
  selectedName,
  round,
  level,
  lives,
}: ResolveNoiseFilterSelectionInput): NoiseFilterSelectionResolution => {
  const isCorrect = isAnswerCorrect(selectedName, round);

  if (isCorrect) {
    return {
      isCorrect: true,
      scoreDelta: calculateNoiseFilterScore(level),
      shouldAdvanceLevel: true,
      shouldLoseLife: false,
      shouldRetryLevel: false,
      shouldEndGame: false,
    };
  }

  return {
    isCorrect: false,
    scoreDelta: 0,
    shouldAdvanceLevel: false,
    shouldLoseLife: true,
    shouldRetryLevel: lives > 1,
    shouldEndGame: lives <= 1,
  };
};

export const isNoiseFilterInteractionLocked = (
  selectedOptionName: string | null,
  hasFeedbackState: boolean,
) => selectedOptionName !== null || hasFeedbackState;

export const buildNoiseFilterFeedbackMessage = (
  resolution: NoiseFilterSelectionResolution,
  currentLevel: number,
  maxLevel: number,
  lives: number,
) => {
  if (resolution.isCorrect) {
    if (currentLevel >= maxLevel) {
      return "Doğru seçim! Son sesi de bildin, oyun tamamlanıyor.";
    }

    return `Doğru seçim! ${currentLevel + 1}. seviyeye geçiliyor.`;
  }

  if (resolution.shouldEndGame) {
    return "Yanlış seçim! Son can da gitti, oyun bitiyor.";
  }

  return `Yanlış seçim! ${Math.max(lives - 1, 0)} can kaldı, aynı seviye yeniden başlıyor.`;
};
