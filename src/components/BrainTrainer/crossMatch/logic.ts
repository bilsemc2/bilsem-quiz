import { COLORS, SHAPE_COUNT } from "./constants.ts";
import type { Card } from "./types.ts";

type RandomFn = () => number;

const shuffleItems = <T>(items: readonly T[], random: RandomFn) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const getPairCountForLevel = (level: number) =>
  Math.min(8, 2 + Math.floor(level / 2.5));

export const getShuffleIntervalForLevel = (level: number) =>
  level > 3 ? Math.max(3000, 8000 - level * 400) : null;

export const createCards = (level: number, random: RandomFn = Math.random) => {
  const pairCount = getPairCountForLevel(level);
  const selectedPairs: Array<{ symbolIdx: number; colorIdx: number }> = [];

  while (selectedPairs.length < pairCount) {
    const symbolIdx = Math.floor(random() * SHAPE_COUNT);
    const colorIdx = Math.floor(random() * COLORS.length);

    if (
      !selectedPairs.some(
        (pair) => pair.symbolIdx === symbolIdx && pair.colorIdx === colorIdx,
      )
    ) {
      selectedPairs.push({ symbolIdx, colorIdx });
    }
  }

  const deck = shuffleItems(
    selectedPairs.flatMap((pair, pairIndex) =>
      [0, 1].map((copyIndex) => ({
        id: `pair-${pairIndex}-${copyIndex}`,
        symbolIdx: pair.symbolIdx,
        colorIdx: pair.colorIdx,
        isFlipped: true,
        isMatched: false,
        position: 0,
      })),
    ),
    random,
  );

  return deck.map((card, index) => ({ ...card, position: index }));
};

export const shuffleCardPositions = (
  cards: readonly Card[],
  random: RandomFn = Math.random,
) => {
  const positions = shuffleItems(
    Array.from({ length: cards.length }, (_, index) => index),
    random,
  );

  return cards.map((card, index) => ({ ...card, position: positions[index] }));
};

export const flipCard = (cards: readonly Card[], cardId: string, isFlipped = true) =>
  cards.map((card) => (card.id === cardId ? { ...card, isFlipped } : card));

export const hideCards = (cards: readonly Card[], cardIds: readonly string[]) =>
  cards.map((card) =>
    cardIds.includes(card.id) ? { ...card, isFlipped: false } : card,
  );

export const markCardsMatched = (
  cards: readonly Card[],
  cardIds: readonly string[],
) =>
  cards.map((card) =>
    cardIds.includes(card.id)
      ? { ...card, isMatched: true, isFlipped: true }
      : card,
  );

export const areCardsMatch = (first: Card | null, second: Card | null) =>
  Boolean(
    first &&
      second &&
      first.symbolIdx === second.symbolIdx &&
      first.colorIdx === second.colorIdx,
  );

export const areAllCardsMatched = (cards: readonly Card[]) =>
  cards.every((card) => card.isMatched);
