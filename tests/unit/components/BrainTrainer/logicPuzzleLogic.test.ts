import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateLogicPuzzleScore,
  createCountMatchPuzzle,
  createPuzzle,
  createSameColorPuzzle,
  createSameTypePuzzle,
  translateColor,
  translateType,
} from "../../../../src/components/BrainTrainer/logicPuzzle/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("createSameColorPuzzle keeps examples and the correct option on one color", () => {
  const puzzle = createSameColorPuzzle(createSeededRandom(42));
  const correctOption = puzzle.options.find((option) => option.isCorrect);

  assert.equal(puzzle.options.length, 4);
  assert.ok(correctOption);
  const targetColor = correctOption.group.shapes[0].color;
  assert.ok(correctOption.group.shapes.every((shape) => shape.color === targetColor));
  assert.ok(
    puzzle.examples.every((group) =>
      group.shapes.every((shape) => shape.color === targetColor),
    ),
  );
});

test("createSameTypePuzzle keeps examples and the correct option on one shape type", () => {
  const puzzle = createSameTypePuzzle(createSeededRandom(77));
  const correctOption = puzzle.options.find((option) => option.isCorrect);

  assert.ok(correctOption);
  const targetType = correctOption.group.shapes[0].type;
  assert.ok(correctOption.group.shapes.every((shape) => shape.type === targetType));
  assert.ok(
    puzzle.examples.every((group) =>
      group.shapes.every((shape) => shape.type === targetType),
    ),
  );
});

test("createCountMatchPuzzle keeps the correct shape count across examples", () => {
  const puzzle = createCountMatchPuzzle(createSeededRandom(99));
  const correctOption = puzzle.options.find((option) => option.isCorrect);

  assert.ok(correctOption);
  const targetCount = correctOption.group.shapes.length;
  assert.ok(puzzle.examples.every((group) => group.shapes.length === targetCount));
  assert.ok(
    puzzle.options
      .filter((option) => !option.isCorrect)
      .every((option) => option.group.shapes.length !== targetCount),
  );
});

test("createPuzzle always returns one correct option among four choices", () => {
  const puzzle = createPuzzle(createSeededRandom(123));

  assert.equal(puzzle.options.length, 4);
  assert.equal(puzzle.options.filter((option) => option.isCorrect).length, 1);
});

test("translation helpers return Turkish labels", () => {
  assert.equal(translateColor("purple"), "Mor");
  assert.equal(translateType("hexagon"), "Altıgen");
});

test("calculateLogicPuzzleScore scales with level", () => {
  assert.equal(calculateLogicPuzzleScore(7), 70);
});
