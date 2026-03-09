import assert from "node:assert/strict";
import test from "node:test";

import {
  calculatePanWeight,
  calculateVisualAlgebraScore,
  generateLevel,
  getShapesForLevel,
} from "../../../../src/components/BrainTrainer/visualAlgebra/logic.ts";
import { ShapeType } from "../../../../src/components/BrainTrainer/visualAlgebra/types.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("shape bands preserve the original unlock thresholds", () => {
  assert.deepEqual(getShapesForLevel(1), [ShapeType.SQUARE, ShapeType.TRIANGLE]);
  assert.deepEqual(getShapesForLevel(5), [
    ShapeType.SQUARE,
    ShapeType.TRIANGLE,
    ShapeType.CIRCLE,
  ]);
  assert.deepEqual(getShapesForLevel(10), [
    ShapeType.SQUARE,
    ShapeType.TRIANGLE,
    ShapeType.CIRCLE,
    ShapeType.STAR,
  ]);
});

test("weight and score helpers preserve the legacy rules", () => {
  assert.equal(
    calculatePanWeight(
      { [ShapeType.SQUARE]: 2, [ShapeType.CIRCLE]: 1 },
      { [ShapeType.SQUARE]: 3, [ShapeType.CIRCLE]: 4 },
    ),
    10,
  );
  assert.equal(calculateVisualAlgebraScore(7), 70);
});

test("generateLevel returns a balanced reference equation", () => {
  const level = generateLevel(8, createSeededRandom(42));

  assert.equal(level.levelNumber, 8);
  assert.equal(
    calculatePanWeight(level.referenceEquation.left, level.weights),
    calculatePanWeight(level.referenceEquation.right, level.weights),
  );
  assert.equal(Object.keys(level.question.left).length > 0, true);
  assert.equal(level.description.length > 0, true);
});
