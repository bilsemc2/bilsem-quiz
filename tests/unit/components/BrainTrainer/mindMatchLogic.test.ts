import assert from "node:assert/strict";
import test from "node:test";

import { CATEGORIES } from "../../../../src/components/BrainTrainer/mindMatch/data.ts";
import {
  calculateMindMatchScore,
  evaluatePuzzleSelection,
  generatePuzzle,
  getCorrectCountForLevel,
  toggleSelectedId,
} from "../../../../src/components/BrainTrainer/mindMatch/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("getCorrectCountForLevel unlocks larger match sets by level", () => {
  assert.equal(getCorrectCountForLevel(1), 4);
  assert.equal(getCorrectCountForLevel(8), 5);
  assert.equal(getCorrectCountForLevel(20), 6);
});

test("generatePuzzle builds a nine-item board with level-scaled matches", () => {
  const puzzle = generatePuzzle(10, createSeededRandom(42));
  const categoryItems = new Set(
    CATEGORIES[puzzle.category].items.map((item) => item.name),
  );
  const matchItems = puzzle.items.filter((item) => item.isMatch);

  assert.equal(puzzle.items.length, 9);
  assert.equal(matchItems.length, 5);
  assert.equal(new Set(puzzle.items.map((item) => item.id)).size, 9);
  assert.ok(matchItems.every((item) => categoryItems.has(item.name)));
});

test("toggleSelectedId adds and removes the same card id", () => {
  const afterAdd = toggleSelectedId(new Set<string>(), "card-1");
  const afterRemove = toggleSelectedId(afterAdd, "card-1");

  assert.equal(afterAdd.has("card-1"), true);
  assert.equal(afterRemove.has("card-1"), false);
});

test("evaluatePuzzleSelection reports missed and wrong choices", () => {
  const puzzle = generatePuzzle(4, createSeededRandom(77));
  const correctIds = puzzle.items
    .filter((item) => item.isMatch)
    .map((item) => item.id);
  const wrongId = puzzle.items.find((item) => !item.isMatch)?.id;
  const selectedIds = new Set([correctIds[0], wrongId!]);
  const result = evaluatePuzzleSelection(puzzle, selectedIds);

  assert.equal(result.isCorrect, false);
  assert.equal(result.missedIds.length, correctIds.length - 1);
  assert.deepEqual(result.wrongIds, [wrongId]);
});

test("calculateMindMatchScore scales with level", () => {
  assert.equal(calculateMindMatchScore(6), 60);
});
