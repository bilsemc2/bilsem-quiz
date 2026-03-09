import assert from "node:assert/strict";
import test from "node:test";

import {
  createAttentionCodingRound,
  createKeyMappings,
  createTestItems,
  getAttentionCodingScore,
  getAvailableAnswerShapes,
  getItemCountForLevel,
  getShapeCountForLevel,
  isCorrectAnswer,
} from "../../../../src/components/BrainTrainer/attentionCoding/logic.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("shape count scales across the original level bands", () => {
  assert.equal(getShapeCountForLevel(1), 5);
  assert.equal(getShapeCountForLevel(8), 6);
  assert.equal(getShapeCountForLevel(15), 7);
});

test("item count scales across the original level bands", () => {
  assert.equal(getItemCountForLevel(2), 5);
  assert.equal(getItemCountForLevel(6), 6);
  assert.equal(getItemCountForLevel(10), 7);
  assert.equal(getItemCountForLevel(15), 8);
  assert.equal(getItemCountForLevel(19), 9);
});

test("key mappings use sequential numbers and unique shuffled shapes", () => {
  const mappings = createKeyMappings(
    12,
    createDeterministicRandom(0.8, 0.1, 0.3, 0.6, 0.2, 0.5, 0.4),
  );

  assert.equal(mappings.length, 7);
  assert.deepEqual(
    mappings.map((mapping) => mapping.number),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(new Set(mappings.map((mapping) => mapping.shape)).size, 7);
});

test("test items stay within the available target range", () => {
  const items = createTestItems(
    16,
    6,
    createDeterministicRandom(0, 0.2, 0.99, 0.5, 0.75, 0.3, 0.1, 0.4),
  );

  assert.equal(items.length, 8);
  assert.ok(items.every((item) => item.targetNumber >= 1 && item.targetNumber <= 6));
});

test("round generation packages mappings and items together", () => {
  const round = createAttentionCodingRound(
    4,
    createDeterministicRandom(0.2, 0.7, 0.4, 0.9, 0.1, 0.3, 0.8, 0.2, 0.5, 0.6),
  );

  assert.equal(round.keyMappings.length, 5);
  assert.equal(round.items.length, 6);
});

test("available answer shapes preserve the canonical shape order", () => {
  const shapes = getAvailableAnswerShapes([
    { number: 1, shape: "star" },
    { number: 2, shape: "circle" },
    { number: 3, shape: "hexagon" },
  ]);

  assert.deepEqual(shapes, ["circle", "star", "hexagon"]);
});

test("answer validation and score preserve the legacy rules", () => {
  assert.equal(
    isCorrectAnswer(
      [
        { number: 1, shape: "triangle" },
        { number: 2, shape: "plus" },
      ],
      2,
      "plus",
    ),
    true,
  );
  assert.equal(getAttentionCodingScore(9), 65);
});
