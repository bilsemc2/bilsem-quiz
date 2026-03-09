import { ALPHABET, CONSONANTS, VOWELS } from "./constants.ts";
import type {
  LevelConfig,
  RoundResult,
  WordHuntItem,
  WordHuntRound,
} from "./types.ts";

type RandomFn = () => number;

const pick = <T,>(items: readonly T[], random: RandomFn): T =>
  items[Math.floor(random() * items.length)];

const createItemId = (index: number, text: string, random: RandomFn) =>
  `${index}-${text}-${Math.floor(random() * 1_000_000_000).toString(36)}`;

export const getLevelConfig = (level: number): LevelConfig => {
  if (level <= 5) {
    return { wordLen: 5, items: 8, roundDur: 4.5 - (level - 1) * 0.1, flash: 0.6, targetLen: 1 };
  }

  if (level <= 10) {
    return {
      wordLen: 6,
      items: 9,
      roundDur: 3.8 - (level - 6) * 0.1,
      flash: 0.55,
      targetLen: level >= 8 ? 2 : 1,
    };
  }

  if (level <= 15) {
    return {
      wordLen: 7,
      items: 10,
      roundDur: 3.2 - (level - 11) * 0.1,
      flash: 0.5,
      targetLen: Math.min(3, 2 + Math.floor((level - 11) / 3)),
    };
  }

  return {
    wordLen: 8,
    items: 12,
    roundDur: 2.6 - (level - 16) * 0.05,
    flash: 0.4,
    targetLen: Math.min(4, 3 + Math.floor((level - 16) / 3)),
  };
};

export const makeNGram = (
  length: number,
  random: RandomFn = Math.random,
) => {
  let result = "";
  let useVowel = random() > 0.5;

  for (let index = 0; index < length; index += 1) {
    result += useVowel ? pick(VOWELS, random) : pick(CONSONANTS, random);
    useVowel = !useVowel;
  }

  return result;
};

export const makeWord = (
  length: number,
  random: RandomFn = Math.random,
) => {
  let word = "";
  let useVowel = random() > 0.45;

  for (let index = 0; index < length; index += 1) {
    word += useVowel ? pick(VOWELS, random) : pick(CONSONANTS, random);
    useVowel = !useVowel;

    if (random() < 0.18) {
      useVowel = !useVowel;
    }
  }

  return word;
};

export const insertTarget = (
  word: string,
  target: string,
  random: RandomFn = Math.random,
) => {
  if (word.length < target.length) {
    return target;
  }

  const start = Math.floor(random() * (word.length - target.length + 1));
  return word.slice(0, start) + target + word.slice(start + target.length);
};

export const createTarget = (
  targetLength: number,
  random: RandomFn = Math.random,
) => (targetLength <= 1 ? pick(ALPHABET, random) : makeNGram(targetLength, random));

export const generateItems = (
  target: string,
  wordLength: number,
  count: number,
  random: RandomFn = Math.random,
): WordHuntItem[] => {
  const targetCount = Math.min(
    count - 2,
    Math.max(2, Math.round(count * 0.5) + (Math.floor(random() * 3) - 1)),
  );
  const items: WordHuntItem[] = [];

  for (let index = 0; index < count; index += 1) {
    const hasTarget = index < targetCount;
    let text = hasTarget
      ? insertTarget(makeWord(wordLength, random), target, random)
      : makeWord(wordLength, random);

    while (!hasTarget && text.includes(target)) {
      text = makeWord(wordLength, random);
    }

    items.push({
      id: createItemId(index, text, random),
      text,
      hasTarget,
    });
  }

  return items
    .map((item) => ({ item, order: random() }))
    .sort((left, right) => left.order - right.order)
    .map(({ item }) => item);
};

export const createRound = (
  level: number,
  random: RandomFn = Math.random,
): WordHuntRound => {
  const config = getLevelConfig(level);
  const target = createTarget(config.targetLen, random);
  const items = generateItems(target, config.wordLen, config.items, random);
  const totalTargets = items.filter((item) => item.hasTarget).length;

  return {
    target,
    items,
    config,
    maxSelections: totalTargets + 2,
  };
};

export const toggleSelectedItem = (
  current: Set<string>,
  id: string,
  maxSelections: number,
) => {
  const next = new Set(current);

  if (next.has(id)) {
    next.delete(id);
    return next;
  }

  if (next.size >= maxSelections) {
    return current;
  }

  next.add(id);
  return next;
};

export const evaluateRound = (
  items: WordHuntItem[],
  selectedIds: Set<string>,
): RoundResult => {
  const totalTargets = items.filter((item) => item.hasTarget).length;
  const correctSelections = items.filter(
    (item) => item.hasTarget && selectedIds.has(item.id),
  ).length;
  const incorrectSelections = selectedIds.size - correctSelections;
  const isSuccess =
    totalTargets > 0 &&
    correctSelections === totalTargets &&
    incorrectSelections <= 1;

  return {
    totalTargets,
    correctSelections,
    incorrectSelections,
    isSuccess,
  };
};

export const calculateWordHuntScore = (
  level: number,
  correctSelections: number,
  incorrectSelections: number,
) => level * 10 + correctSelections * 5 - incorrectSelections * 5;
