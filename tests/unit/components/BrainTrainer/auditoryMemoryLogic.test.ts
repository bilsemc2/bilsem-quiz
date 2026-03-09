import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAuditoryMemoryScore,
  generateSequence,
  getSequenceLength,
  isExpectedNote,
  isSequenceComplete,
} from "../../../../src/components/BrainTrainer/auditoryMemory/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("getSequenceLength scales with level and caps at nine", () => {
  assert.equal(getSequenceLength(1), 3);
  assert.equal(getSequenceLength(5), 7);
  assert.equal(getSequenceLength(20), 9);
});

test("generateSequence uses the configured level length and note bounds", () => {
  const sequence = generateSequence(6, 8, createSeededRandom(42));

  assert.equal(sequence.length, 8);
  assert.ok(sequence.every((noteIndex) => noteIndex >= 0 && noteIndex < 8));
});

test("isExpectedNote validates the next note in order", () => {
  const sequence = [1, 3, 5];

  assert.equal(isExpectedNote(sequence, 0, 1), true);
  assert.equal(isExpectedNote(sequence, 1, 5), false);
});

test("isSequenceComplete only succeeds on the final input", () => {
  assert.equal(isSequenceComplete([1, 2, 3], 2), false);
  assert.equal(isSequenceComplete([1, 2, 3], 3), true);
});

test("calculateAuditoryMemoryScore preserves the original formula", () => {
  assert.equal(calculateAuditoryMemoryScore(7), 120);
});
