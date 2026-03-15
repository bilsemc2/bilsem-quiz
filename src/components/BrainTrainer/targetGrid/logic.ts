import {
  BASE_PREVIEW_TIME,
  GRID_SIZE,
} from "./constants.ts";
import type { Card, RoundData } from "./types.ts";

type RandomFn = () => number;

const randomInt = (min: number, max: number, random: RandomFn = Math.random) =>
  Math.floor(random() * (max - min + 1)) + min;

const shuffleItems = <T,>(items: readonly T[], random: RandomFn = Math.random) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const createCardId = (level: number, index: number, random: RandomFn = Math.random) =>
  `card-${level}-${index}-${random().toString(36).slice(2, 7)}`;

export const getCombinationSize = (level: number, random: RandomFn = Math.random) =>
  random() > 0.7 && level > 5 ? 3 : 2;

export const getPreviewSeconds = (level: number) =>
  Math.max(1, BASE_PREVIEW_TIME - Math.floor(level / 5));

export const createCards = (level: number, random: RandomFn = Math.random): Card[] =>
  Array.from({ length: GRID_SIZE }, (_, index) => ({
    id: createCardId(level, index, random),
    isRevealed: true,
    isSolved: false,
    value: randomInt(1, 9, random),
  }));

export const pickSolutionIndices = (
  count: number,
  random: RandomFn = Math.random,
) => shuffleItems(
  Array.from({ length: GRID_SIZE }, (_, index) => index),
  random,
).slice(0, count);

export const createRound = (level: number, random: RandomFn = Math.random): RoundData => {
  const cards = createCards(level, random);
  const solutionIndices = pickSolutionIndices(getCombinationSize(level, random), random);
  const targetSum = solutionIndices.reduce((sum, index) => sum + cards[index].value, 0);

  return {
    cards,
    previewSeconds: getPreviewSeconds(level),
    solutionIndices,
    targetSum,
  };
};

export const revealCard = (cards: Card[], index: number) =>
  cards.map((card, cardIndex) =>
    cardIndex === index ? { ...card, isRevealed: true } : card,
  );

export const hideCardsAtIndices = (cards: Card[], indices: number[]) =>
  cards.map((card, cardIndex) =>
    indices.includes(cardIndex) ? { ...card, isRevealed: false } : card,
  );

export const hideAllCards = (cards: Card[]) =>
  cards.map((card) => ({ ...card, isRevealed: false }));

export const calculateTargetGridScore = (level: number) => 20 * level;

export const buildTargetGridFeedbackMessage = ({
  correct,
  targetSum,
  level,
  maxLevel,
}: {
  correct: boolean;
  targetSum: number;
  level: number;
  maxLevel: number;
}) => {
  if (correct) {
    if (level >= maxLevel) {
      return `Harika toplam! ${targetSum} hedefini de çözdün, oyun tamamlanıyor.`;
    }

    return `Doğru toplam: ${targetSum}. Şimdi ${level + 1}. seviyeye geçiyorsun.`;
  }

  return `Yanlış toplam! Hedef ${targetSum} olmalıydı.`;
};
