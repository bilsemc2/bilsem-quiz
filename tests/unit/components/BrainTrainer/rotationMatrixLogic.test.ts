import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOptions,
  buildSequence,
  calculateRotationMatrixScore,
  createBaseShape,
  createRound,
} from "../../../../src/components/BrainTrainer/rotationMatrix/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("base shape generation keeps stick counts and ranges in legacy bounds", () => {
  const shape = createBaseShape(createSeededRandom(11));

  assert.equal(shape.type, "sticks");
  assert.equal(shape.rotation, 0);
  assert.ok(shape.sticks.length >= 4 && shape.sticks.length <= 7);
  shape.sticks.forEach((stick) => {
    assert.ok(stick.length >= 35 && stick.length <= 90);
  });
});

test("sequence generation applies a constant rotation step across the matrix", () => {
  const baseShape = createBaseShape(createSeededRandom(21));
  const sequence = buildSequence(baseShape, 90, createSeededRandom(22));

  assert.equal(sequence.length, 9);
  assert.deepEqual(
    sequence.map((shape) => shape.rotation),
    [0, 90, 180, 270, 0, 90, 180, 270, 0],
  );
});

test("options keep a single correct answer and unique rotations", () => {
  const baseShape = createBaseShape(createSeededRandom(31));
  const sequence = buildSequence(baseShape, 45, createSeededRandom(32));
  const options = buildOptions(baseShape, sequence[4], createSeededRandom(33));

  assert.equal(options.length, 4);
  assert.equal(options.filter((option) => option.isCorrect).length, 1);
  assert.equal(
    new Set(options.map((option) => option.shape.rotation)).size,
    4,
  );
});

test("round generation packages sequence, target and answer set together", () => {
  const round = createRound(createSeededRandom(44));

  assert.equal(round.sequence.length, 9);
  assert.ok(round.targetIndex >= 0 && round.targetIndex < 9);
  assert.equal(round.options.length, 4);
  assert.ok(
    round.options.some(
      (option) => option.isCorrect && option.shape.rotation === round.sequence[round.targetIndex]?.rotation,
    ),
  );
});

test("score formula preserves the legacy level multiplier", () => {
  assert.equal(calculateRotationMatrixScore(1), 10);
  assert.equal(calculateRotationMatrixScore(8), 80);
});
