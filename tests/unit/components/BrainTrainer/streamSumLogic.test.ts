import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateStreamSumScore,
  evaluateInput,
  generateNumber,
  getAnswerTime,
  getExpectedTotal,
  shouldAdvanceLevel,
  shouldTriggerVictory,
} from "../../../../src/components/BrainTrainer/streamSum/logic.ts";

test("answer time decreases by level and clamps at three seconds", () => {
  assert.equal(getAnswerTime(1), 5850);
  assert.equal(getAnswerTime(10), 4500);
  assert.equal(getAnswerTime(30), 3000);
});

test("generated numbers stay within the original one to nine range", () => {
  assert.equal(generateNumber(() => 0), 1);
  assert.equal(generateNumber(() => 0.999), 9);
});

test("input evaluation preserves partial, correct and wrong branches", () => {
  assert.equal(getExpectedTotal(7, 8), 15);
  assert.equal(evaluateInput("1", 15), "partial");
  assert.equal(evaluateInput("15", 15), "correct");
  assert.equal(evaluateInput("14", 15), "wrong");
});

test("score, level-up and victory helpers preserve the legacy rules", () => {
  assert.equal(calculateStreamSumScore(4, 3), 230);
  assert.equal(shouldAdvanceLevel(5, 4), true);
  assert.equal(shouldAdvanceLevel(4, 4), false);
  assert.equal(shouldAdvanceLevel(10, 20), false);
  assert.equal(shouldTriggerVictory(20, 99), false);
  assert.equal(shouldTriggerVictory(20, 100), true);
});
