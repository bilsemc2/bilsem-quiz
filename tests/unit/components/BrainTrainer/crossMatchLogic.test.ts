import assert from "node:assert/strict";
import test from "node:test";

import {
  areAllCardsMatched,
  areCardsMatch,
  createCards,
  flipCard,
  getPairCountForLevel,
  getShuffleIntervalForLevel,
  hideCards,
  markCardsMatched,
  shuffleCardPositions,
} from "../../../../src/components/BrainTrainer/crossMatch/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("pair count and shuffle interval preserve the legacy level bands", () => {
  assert.equal(getPairCountForLevel(1), 2);
  assert.equal(getPairCountForLevel(5), 4);
  assert.equal(getPairCountForLevel(10), 6);
  assert.equal(getPairCountForLevel(20), 8);

  assert.equal(getShuffleIntervalForLevel(3), null);
  assert.equal(getShuffleIntervalForLevel(4), 6400);
  assert.equal(getShuffleIntervalForLevel(12), 3200);
  assert.equal(getShuffleIntervalForLevel(19), 3000);
});

test("card generation creates duplicated pairs with unique positions", () => {
  const cards = createCards(8, createSeededRandom(42));
  const signatureCounts = new Map<string, number>();

  cards.forEach((card) => {
    const signature = `${card.symbolIdx}-${card.colorIdx}`;
    signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
  });

  assert.equal(cards.length, getPairCountForLevel(8) * 2);
  assert.equal(new Set(cards.map((card) => card.id)).size, cards.length);
  assert.equal(new Set(cards.map((card) => card.position)).size, cards.length);
  assert.equal(
    [...signatureCounts.values()].every((count) => count === 2),
    true,
  );
});

test("position shuffling keeps ids while reassigning unique slots", () => {
  const cards = createCards(4, createSeededRandom(7));
  const shuffled = shuffleCardPositions(cards, createSeededRandom(9));

  assert.deepEqual(
    shuffled.map((card) => card.id).sort(),
    cards.map((card) => card.id).sort(),
  );
  assert.equal(new Set(shuffled.map((card) => card.position)).size, cards.length);
});

test("match helpers flip, hide and resolve pairs correctly", () => {
  const cards = createCards(2, createSeededRandom(5));
  const [first, second] = cards.filter(
    (card) =>
      card.symbolIdx === cards[0].symbolIdx && card.colorIdx === cards[0].colorIdx,
  );
  const nonMatch = cards.find(
    (card) => !areCardsMatch(first, card),
  );

  assert.equal(areCardsMatch(first, second), true);
  assert.equal(areCardsMatch(first, nonMatch ?? null), false);

  const flipped = flipCard(cards, first.id);
  assert.equal(flipped.find((card) => card.id === first.id)?.isFlipped, true);

  const hidden = hideCards(flipped, [first.id]);
  assert.equal(hidden.find((card) => card.id === first.id)?.isFlipped, false);

  const matched = markCardsMatched(cards, [first.id, second.id]);
  assert.equal(matched.find((card) => card.id === first.id)?.isMatched, true);
  assert.equal(
    areAllCardsMatched(markCardsMatched(cards, cards.map((card) => card.id))),
    true,
  );
});
