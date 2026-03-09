import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateReflectionSumScore,
  createRound,
  generateDigits,
  getDigitsSum,
  getDisplaySpeed,
  getSequenceLength,
  isNextSequenceDigitCorrect,
  isSequenceComplete,
  shouldMirror,
} from "../../../../src/components/BrainTrainer/reflectionSum/logic.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("sequence length grows by level and caps at ten", () => {
  assert.equal(getSequenceLength(1), 4);
  assert.equal(getSequenceLength(8), 8);
  assert.equal(getSequenceLength(20), 10);
});

test("display speed accelerates with level and keeps the original clamp", () => {
  assert.equal(getDisplaySpeed(1), 1160);
  assert.equal(getDisplaySpeed(20), 600);
});

test("digit generation stays in 1-9 range and mirror only unlocks after level two", () => {
  const digits = generateDigits(6, createDeterministicRandom(0, 0.2, 0.4, 0.6, 0.8, 0.1, 0.3));

  assert.equal(digits.length, 7);
  assert.ok(digits.every((digit) => digit >= 1 && digit <= 9));
  assert.equal(shouldMirror(2, createDeterministicRandom(0)), false);
  assert.equal(shouldMirror(3, createDeterministicRandom(0.2)), true);
});

test("round helpers validate reversed sequence and total correctly", () => {
  const round = createRound(4, createDeterministicRandom(0, 0.1, 0.2, 0.3, 0.4, 0.9));

  assert.equal(isNextSequenceDigitCorrect(round.digits, [], round.digits.at(-1) ?? 0), true);
  assert.equal(isNextSequenceDigitCorrect(round.digits, [], round.digits[0] ?? 0), false);
  assert.equal(isSequenceComplete(round.digits, round.digits.length), true);
  assert.equal(getDigitsSum(round.digits), round.digits.reduce((sum, digit) => sum + digit, 0));
});

test("score formula preserves level and remaining time contribution", () => {
  assert.equal(calculateReflectionSumScore(6, 95), 69);
});
