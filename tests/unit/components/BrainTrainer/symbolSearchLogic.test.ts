import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateSymbolSearchScore,
  createRound,
  getGroupSize,
  hasTargetInGroup,
  isCorrectAnswer,
} from "../../../../src/components/BrainTrainer/symbolSearch/logic.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("group size follows the original level bands", () => {
  assert.equal(getGroupSize(1), 5);
  assert.equal(getGroupSize(6), 9);
  assert.equal(getGroupSize(11), 15);
  assert.equal(getGroupSize(16), 20);
});

test("createRound can include the target in the search group", () => {
  const round = createRound(8, createDeterministicRandom(0.1, 0.2, 0.3, 0.4, 0.9));

  assert.equal(round.group.length, 9);
  assert.equal(round.hasTarget, true);
  assert.equal(hasTargetInGroup(round), true);
});

test("createRound can exclude the target from the search group", () => {
  const round = createRound(3, createDeterministicRandom(0.1, 0.2, 0.3, 0.4, 0.1));

  assert.equal(round.group.length, 5);
  assert.equal(round.hasTarget, false);
  assert.equal(hasTargetInGroup(round), false);
});

test("answer validation and score preserve the legacy rules", () => {
  const round = createRound(12, createDeterministicRandom(0.1, 0.2, 0.3, 0.4, 0.9));

  assert.equal(isCorrectAnswer(true, round), true);
  assert.equal(isCorrectAnswer(false, round), false);
  assert.equal(calculateSymbolSearchScore(6), 60);
});
