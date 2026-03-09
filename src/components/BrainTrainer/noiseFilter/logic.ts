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

export const createRound = (
  soundPool: readonly SoundItem[] = sounds,
  random: RandomFn = Math.random,
  optionCount = NUMBER_OF_OPTIONS,
): NoiseFilterRound | null => {
  const targetSound = pickRandomItem(soundPool, random);

  if (!targetSound) {
    return null;
  }

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
