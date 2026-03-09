import assert from "node:assert/strict";
import test from "node:test";

import {
  calculatePerceptualSpeedScore,
  createChallenge,
  getDigitLengthForLevel,
  isAnswerCorrect,
} from "../../../../src/components/BrainTrainer/perceptualSpeed/logic.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;

  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("digit length grows every four levels and caps at nine", () => {
  assert.equal(getDigitLengthForLevel(1), 5);
  assert.equal(getDigitLengthForLevel(4), 5);
  assert.equal(getDigitLengthForLevel(5), 6);
  assert.equal(getDigitLengthForLevel(17), 9);
  assert.equal(getDigitLengthForLevel(40), 9);
});

test("same challenge keeps both sequences identical", () => {
  const challenge = createChallenge(
    4,
    createDeterministicRandom(0.1, 0.2, 0.3, 0.4, 0.9),
  );

  assert.equal(challenge.type, "same");
  assert.equal(challenge.isSame, true);
  assert.equal(challenge.left, "1234");
  assert.equal(challenge.right, "1234");
});

test("transposition challenge swaps adjacent digits", () => {
  const challenge = createChallenge(
    4,
    createDeterministicRandom(0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.6),
  );

  assert.equal(challenge.type, "transposition");
  assert.equal(challenge.isSame, false);
  assert.equal(challenge.left, "1234");
  assert.equal(challenge.right, "1324");
});

test("similarity challenge replaces with a configured confusion pair", () => {
  const challenge = createChallenge(
    4,
    createDeterministicRandom(0.3, 0.6, 0.0, 0.1, 0.1, 0.5, 0.0, 0.0),
  );

  assert.equal(challenge.type, "similarity");
  assert.equal(challenge.isSame, false);
  assert.equal(challenge.left, "3601");
  assert.equal(challenge.right, "8601");
});

test("score and answer helpers preserve the legacy rules", () => {
  const challenge = createChallenge(
    3,
    createDeterministicRandom(0.1, 0.2, 0.3, 0.9),
  );

  assert.equal(calculatePerceptualSpeedScore(1), 10);
  assert.equal(calculatePerceptualSpeedScore(8), 80);
  assert.equal(isAnswerCorrect(true, challenge), true);
  assert.equal(isAnswerCorrect(false, challenge), false);
  assert.equal(isAnswerCorrect(false, null), false);
});
