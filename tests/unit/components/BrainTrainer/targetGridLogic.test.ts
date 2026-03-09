import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateTargetGridScore,
  createRound,
  getCombinationSize,
  getPreviewSeconds,
  hideAllCards,
  hideCardsAtIndices,
  revealCard,
} from "../../../../src/components/BrainTrainer/targetGrid/logic.ts";
import type { Card } from "../../../../src/components/BrainTrainer/targetGrid/types.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("preview duration shrinks by level band and floors at one second", () => {
  assert.equal(getPreviewSeconds(1), 4);
  assert.equal(getPreviewSeconds(5), 3);
  assert.equal(getPreviewSeconds(10), 2);
  assert.equal(getPreviewSeconds(20), 1);
});

test("combination size stays at two until the higher level random branch unlocks", () => {
  assert.equal(getCombinationSize(4, createDeterministicRandom(0.99)), 2);
  assert.equal(getCombinationSize(8, createDeterministicRandom(0.8)), 3);
  assert.equal(getCombinationSize(8, createDeterministicRandom(0.2)), 2);
});

test("round generation returns sixteen previewed cards and a valid target sum", () => {
  const round = createRound(
    8,
    createDeterministicRandom(
      0.9,
      0.0,
      0.1,
      0.2,
      0.3,
      0.4,
      0.5,
      0.6,
      0.7,
      0.8,
      0.9,
      0.1,
      0.2,
      0.3,
      0.4,
      0.5,
      0.6,
      0.7,
      0.8,
      0.9,
      0.2,
      0.4,
      0.6,
      0.8,
      0.1,
      0.3,
      0.5,
      0.7,
      0.9,
      0.2,
      0.4,
      0.6,
      0.8,
      0.1,
      0.3,
      0.5,
      0.7,
    ),
  );

  assert.equal(round.cards.length, 16);
  assert.ok(round.cards.every((card) => card.isRevealed));
  assert.equal(new Set(round.solutionIndices).size, round.solutionIndices.length);
  assert.equal(
    round.targetSum,
    round.solutionIndices.reduce((sum, index) => sum + round.cards[index].value, 0),
  );
});

test("card reveal and hide helpers preserve the intended selection visibility", () => {
  const cards: Card[] = [
    { id: "a", isRevealed: false, isSolved: false, value: 2 },
    { id: "b", isRevealed: true, isSolved: false, value: 5 },
    { id: "c", isRevealed: true, isSolved: false, value: 8 },
  ];

  const revealedCards = revealCard(cards, 0);
  assert.equal(revealedCards[0].isRevealed, true);

  const hiddenSelection = hideCardsAtIndices(revealedCards, [0, 2]);
  assert.equal(hiddenSelection[0].isRevealed, false);
  assert.equal(hiddenSelection[1].isRevealed, true);
  assert.equal(hiddenSelection[2].isRevealed, false);

  const hiddenAll = hideAllCards(revealedCards);
  assert.ok(hiddenAll.every((card) => card.isRevealed === false));
});

test("score formula preserves the legacy level multiplier", () => {
  assert.equal(calculateTargetGridScore(6), 120);
});
