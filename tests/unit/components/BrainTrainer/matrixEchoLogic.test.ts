import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateMatrixEchoScore,
  createQuestion,
  generateCells,
  getAvailableQuestionKinds,
  getCellCount,
  getMemorizeTime,
  getMaxNumber,
} from "../../../../src/components/BrainTrainer/matrixEcho/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;

  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("cell count, max number and memorize time keep the original level bands", () => {
  assert.equal(getCellCount(1), 3);
  assert.equal(getCellCount(7), 5);
  assert.equal(getCellCount(20), 7);

  assert.equal(getMaxNumber(1), 11);
  assert.equal(getMaxNumber(10), 29);
  assert.equal(getMaxNumber(20), 30);

  assert.equal(getMemorizeTime(1), 4000);
  assert.equal(getMemorizeTime(10), 2650);
  assert.equal(getMemorizeTime(20), 1500);
});

test("cell generation preserves unique boxes, unique values and legacy bounds", () => {
  const level = 9;
  const cells = generateCells(level, createSeededRandom(19));

  assert.equal(cells.length, 5);
  assert.equal(new Set(cells.map((cell) => cell.gridIndex)).size, cells.length);
  assert.equal(new Set(cells.map((cell) => cell.value)).size, cells.length);

  cells.forEach((cell) => {
    assert.ok(cell.gridIndex >= 0 && cell.gridIndex < 9);
    assert.ok(cell.value >= 1 && cell.value <= getMaxNumber(level));
  });
});

test("question unlock bands match the original level gates", () => {
  assert.deepEqual(getAvailableQuestionKinds(1, 3), [
    "value-by-position",
    "position-by-value",
    "max-position",
    "min-position",
  ]);

  assert.deepEqual(getAvailableQuestionKinds(5, 2), [
    "value-by-position",
    "position-by-value",
    "max-position",
    "min-position",
    "sum-by-position",
  ]);

  assert.deepEqual(getAvailableQuestionKinds(10, 2), [
    "value-by-position",
    "position-by-value",
    "max-position",
    "min-position",
    "sum-by-position",
    "difference-by-position",
  ]);
});

test("question generation can build the legacy difference prompt and answer set", () => {
  const question = createQuestion(
    [
      { gridIndex: 0, value: 7 },
      { gridIndex: 4, value: 3 },
    ],
    10,
    createDeterministicRandom(0.99, 0.9, 0.2, 0.8, 0.4, 0.3, 0.6, 0.9),
  );

  assert.equal(question.text, "1. kutu ile 5. kutu farkı?");
  assert.equal(question.answer, 4);
  assert.equal(question.options.length, 4);
  assert.ok(question.options.includes(4));
});

test("score formula preserves the legacy level multiplier", () => {
  assert.equal(calculateMatrixEchoScore(1), 10);
  assert.equal(calculateMatrixEchoScore(8), 80);
});
