import assert from "node:assert/strict";
import test from "node:test";

import {
  checkStep,
  COLORS,
  computeScore,
  generateSequence,
  getColorById,
  getDelayTime,
  getDisplayTime,
  isSequenceComplete,
} from "../../../../src/components/BrainTrainer/colorGrid/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("generateSequence returns level+1 steps with valid cell and color ids", () => {
  const random = createSeededRandom(42);

  for (const level of [1, 5, 10, 20]) {
    const seq = generateSequence(level, random);
    assert.equal(seq.length, level + 1);

    seq.forEach((step) => {
      assert.ok(step.cellId >= 0 && step.cellId < 9);
      assert.ok(COLORS.some((c) => c.id === step.colorId));
    });
  }
});

test("generateSequence with fixed random produces deterministic output", () => {
  const a = generateSequence(3, createSeededRandom(7));
  const b = generateSequence(3, createSeededRandom(7));
  assert.deepEqual(a, b);
});

test("getDisplayTime decreases with level and floors at 300", () => {
  assert.equal(getDisplayTime(1), 970);
  assert.equal(getDisplayTime(10), 700);
  assert.ok(getDisplayTime(100) >= 300);
  assert.equal(getDisplayTime(100), 300);
});

test("getDelayTime decreases with level and floors at 100", () => {
  assert.equal(getDelayTime(1), 390);
  assert.equal(getDelayTime(10), 300);
  assert.ok(getDelayTime(100) >= 100);
  assert.equal(getDelayTime(100), 100);
});

test("checkStep validates the correct cell id at the given index", () => {
  const seq = [
    { cellId: 3, colorId: "red" },
    { cellId: 7, colorId: "blue" },
    { cellId: 0, colorId: "green" },
  ] as const;

  assert.equal(checkStep(3, seq, 0), true);
  assert.equal(checkStep(7, seq, 1), true);
  assert.equal(checkStep(0, seq, 2), true);
  assert.equal(checkStep(5, seq, 0), false);
});

test("isSequenceComplete returns true only when all steps are matched", () => {
  assert.equal(isSequenceComplete(3, 3), true);
  assert.equal(isSequenceComplete(2, 3), false);
  assert.equal(isSequenceComplete(0, 3), false);
});

test("computeScore uses the level multiplier", () => {
  assert.equal(computeScore(1), 50);
  assert.equal(computeScore(10), 500);
  assert.equal(computeScore(20), 1000);
});

test("getColorById finds colors and returns undefined for unknowns", () => {
  assert.equal(getColorById("red")?.name, "Kırmızı");
  assert.equal(getColorById("blue")?.name, "Mavi");
  assert.equal(getColorById("nonexistent"), undefined);
});
