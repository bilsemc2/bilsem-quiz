import assert from "node:assert/strict";
import test from "node:test";

import {
  buildQuestionForPattern,
  createQuestionForLevel,
  getAvailablePatternTypes,
  getNumberSequenceScore,
  getSequenceLength,
} from "../../../../src/components/BrainTrainer/numberSequence/logic.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;

  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("pattern unlock bands preserve the original level thresholds", () => {
  assert.deepEqual(getAvailablePatternTypes(1), ["arithmetic", "geometric"]);
  assert.deepEqual(getAvailablePatternTypes(5), [
    "arithmetic",
    "geometric",
    "square",
    "fibonacci",
  ]);
  assert.deepEqual(getAvailablePatternTypes(8), [
    "arithmetic",
    "geometric",
    "square",
    "fibonacci",
    "cube",
    "alternating",
  ]);
  assert.deepEqual(getAvailablePatternTypes(11), [
    "arithmetic",
    "geometric",
    "square",
    "fibonacci",
    "cube",
    "alternating",
    "prime",
    "doubleStep",
  ]);
});

test("sequence length grows by level and caps at six", () => {
  assert.equal(getSequenceLength(1), 4);
  assert.equal(getSequenceLength(5), 5);
  assert.equal(getSequenceLength(10), 6);
  assert.equal(getSequenceLength(20), 6);
});

test("arithmetic pattern keeps a constant difference and valid answer set", () => {
  const question = buildQuestionForPattern(
    "arithmetic",
    5,
    createDeterministicRandom(0, 0, 0.1, 0.2, 0.3, 0.9, 0.8, 0.7),
  );

  assert.deepEqual(question.sequence, [1, 2, 3, 4, 5]);
  assert.equal(question.answer, 6);
  assert.equal(question.patternDescription, "+1");
  assert.equal(question.options.length, 4);
  assert.ok(question.options.includes(6));
});

test("alternating pattern preserves legacy +/- rhythm", () => {
  const question = buildQuestionForPattern(
    "alternating",
    10,
    createDeterministicRandom(0, 0, 0, 0.2, 0.3, 0.9, 0.8, 0.7),
  );

  assert.deepEqual(question.sequence, [5, 6, 5, 6, 5, 6]);
  assert.equal(question.answer, 5);
  assert.equal(question.patternDescription, "+1/-1");
  assert.equal(question.options.length, 4);
  assert.ok(question.options.includes(5));
});

test("prime pattern draws from the legacy prime table", () => {
  const question = buildQuestionForPattern(
    "prime",
    12,
    createDeterministicRandom(0.5, 0.1, 0.2, 0.3, 0.9, 0.8, 0.7),
  );

  assert.deepEqual(question.sequence, [11, 13, 17, 19, 23, 29]);
  assert.equal(question.answer, 31);
  assert.equal(question.patternDescription, "Asallar");
  assert.equal(question.options.length, 4);
  assert.ok(question.options.includes(31));
});

test("level question generation stays within unlocked patterns", () => {
  const question = createQuestionForLevel(
    12,
    createDeterministicRandom(0.99, 0, 0.1, 0.2, 0.3, 0.9, 0.8, 0.7),
  );

  assert.equal(question.patternType, "doubleStep");
  assert.equal(question.sequence.length, 6);
  assert.equal(question.options.length, 4);
  assert.ok(question.options.includes(question.answer));
});

test("score formula preserves the legacy base and level bonus", () => {
  assert.equal(getNumberSequenceScore(1), 30);
  assert.equal(getNumberSequenceScore(8), 65);
});
