import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCreatureLogicScore,
  evaluateSelection,
  generateRound,
  getCreatureCount,
  getCreatureDifficulty,
  getCreatureTraitLines,
  toggleCreatureSelection,
} from "../../../../src/components/BrainTrainer/creatureLogic/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("creature difficulty and count scale by level bands", () => {
  assert.equal(getCreatureDifficulty(1), "easy");
  assert.equal(getCreatureDifficulty(9), "medium");
  assert.equal(getCreatureDifficulty(18), "hard");
  assert.equal(getCreatureCount(2), 6);
  assert.equal(getCreatureCount(7), 9);
  assert.equal(getCreatureCount(19), 12);
});

test("generateRound creates selectable targets for each difficulty band", () => {
  const easyRound = generateRound(2, createSeededRandom(41));
  const mediumRound = generateRound(9, createSeededRandom(77));
  const hardRound = generateRound(18, createSeededRandom(123));

  assert.equal(easyRound.creatures.length, 6);
  assert.equal(mediumRound.creatures.length, 9);
  assert.equal(hardRound.creatures.length, 12);
  assert.ok(easyRound.targetIds.length > 0);
  assert.ok(mediumRound.targetIds.length > 0);
  assert.ok(hardRound.targetIds.length > 0);
});

test("toggleCreatureSelection adds and removes ids", () => {
  assert.deepEqual(toggleCreatureSelection([], 3), [3]);
  assert.deepEqual(toggleCreatureSelection([1, 3], 3), [1]);
});

test("evaluateSelection compares selections independent of order", () => {
  assert.equal(evaluateSelection([3, 1], [1, 3]), true);
  assert.equal(evaluateSelection([1], [1, 3]), false);
  assert.equal(evaluateSelection([1, 2], [1, 3]), false);
});

test("getCreatureTraitLines maps creature traits into localized labels", () => {
  const traitLines = getCreatureTraitLines({
    id: 1,
    color: "green",
    shape: "fluff",
    accessory: "hat",
    emotion: "happy",
  });

  assert.deepEqual(traitLines, [
    "Renk: yeşil",
    "Tip: pofuduk",
    "Aksesuar: şapkalı",
    "Duygu: mutlu",
  ]);
});

test("calculateCreatureLogicScore scales with level", () => {
  assert.equal(calculateCreatureLogicScore(8), 80);
});
