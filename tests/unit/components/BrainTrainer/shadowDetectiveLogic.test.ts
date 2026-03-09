import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateShadowDetectiveScore,
  createDistractor,
  createPattern,
  createRound,
  getItemCountForLevel,
  getPatternSignature,
} from "../../../../src/components/BrainTrainer/shadowDetective/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("getItemCountForLevel increases up to the six-item cap", () => {
  assert.equal(getItemCountForLevel(1), 2);
  assert.equal(getItemCountForLevel(8), 4);
  assert.equal(getItemCountForLevel(20), 6);
});

test("createPattern keeps generated items within bounds", () => {
  const pattern = createPattern(4, createSeededRandom(42));

  assert.equal(pattern.length, 4);

  for (const item of pattern) {
    assert.ok(item.x >= 15 && item.x <= 85);
    assert.ok(item.y >= 15 && item.y <= 85);
    assert.ok(item.scale >= 0.9 && item.scale <= 1.4);
  }
});

test("getPatternSignature ignores item ordering", () => {
  const pattern = createPattern(3, createSeededRandom(99));
  const reordered = [pattern[2], pattern[0], pattern[1]];

  assert.equal(getPatternSignature(pattern), getPatternSignature(reordered));
});

test("createDistractor always changes the original signature", () => {
  const pattern = createPattern(4, createSeededRandom(123));
  const distractor = createDistractor(pattern, createSeededRandom(456));

  assert.equal(distractor.length, pattern.length);
  assert.notEqual(
    getPatternSignature(distractor),
    getPatternSignature(pattern),
  );
});

test("createRound returns four unique options and marks the correct one", () => {
  const round = createRound(12, createSeededRandom(77));
  const signatures = round.options.map(getPatternSignature);

  assert.equal(round.options.length, 4);
  assert.equal(new Set(signatures).size, 4);
  assert.ok(round.correctOptionIndex >= 0 && round.correctOptionIndex < 4);
  assert.equal(
    signatures[round.correctOptionIndex],
    getPatternSignature(round.correctPattern),
  );
});

test("calculateShadowDetectiveScore scales with level", () => {
  assert.equal(calculateShadowDetectiveScore(6), 60);
});
