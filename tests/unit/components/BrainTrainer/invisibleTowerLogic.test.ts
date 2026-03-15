import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateInvisibleTowerScore,
  createRound,
  getEffectiveSegmentValue,
  getFlashDelay,
  getQuestionRevealDelay,
  getRowCount,
} from "../../../../src/components/BrainTrainer/invisibleTower/logic.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;

  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

const createRepeatingRandom = (...values: number[]) => {
  let index = 0;

  return () => {
    const value = values[index % values.length] ?? 0;
    index += 1;
    return value;
  };
};

test("row count and flash delay preserve the original level scaling", () => {
  assert.equal(getRowCount(1), 2);
  assert.equal(getRowCount(8), 4);
  assert.equal(getRowCount(20), 6);

  assert.equal(getFlashDelay(1), 970);
  assert.equal(getFlashDelay(10), 700);
  assert.equal(getFlashDelay(20), 400);
  assert.equal(getQuestionRevealDelay(), 1200);
});

test("effective segment value respects sign and multiplier", () => {
  assert.equal(
    getEffectiveSegmentValue({
      col: 0,
      id: "a",
      isNegative: false,
      multiplier: 2,
      row: 0,
      value: 4,
    }),
    8,
  );

  assert.equal(
    getEffectiveSegmentValue({
      col: 0,
      id: "b",
      isNegative: true,
      row: 0,
      value: 4,
    }),
    -4,
  );
});

test("low-level round generation builds the expected tower and answer set", () => {
  const round = createRound(
    1,
    createDeterministicRandom(0, 0, 0.2, 0.1, 0.4, 0.2, 0.1, 0.2, 0.3, 0.4),
  );

  assert.equal(round.tower.length, 3);
  assert.equal(round.correctAnswer, 7);
  assert.equal(round.options.length, 4);
  assert.ok(round.options.includes(7));
});

test("high-level round generation can include negative blocks without multipliers", () => {
  const round = createRound(9, createRepeatingRandom(0, 0.05, 0.8, 0, 0.1));

  assert.equal(round.tower.length, 10);
  const hasNegative = round.tower.some((segment) => segment.isNegative);
  assert.ok(hasNegative, "level 9 should produce at least one negative block");
  assert.ok(round.tower.every((segment) => segment.multiplier === undefined), "multipliers should be disabled");
  assert.ok(round.options.includes(round.correctAnswer), "correct answer must be among options");
});

test("score formula keeps the legacy level and streak bonus", () => {
  assert.equal(calculateInvisibleTowerScore(1, 1), 15);
  assert.equal(calculateInvisibleTowerScore(7, 3), 85);
});
