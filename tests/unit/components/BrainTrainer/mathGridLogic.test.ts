import assert from "node:assert/strict";
import test from "node:test";

import {
  appendDigitToCell,
  calculateMathGridScore,
  deleteDigitFromCell,
  doesRowMatchOperator,
  generatePuzzle,
  getAvailableOperators,
  getRowsToHideCount,
  validatePuzzle,
} from "../../../../src/components/BrainTrainer/mathGrid/logic.ts";
import type { GridMatrix } from "../../../../src/components/BrainTrainer/mathGrid/types.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("operator progression follows level bands", () => {
  assert.deepEqual(getAvailableOperators(1), ["+"]);
  assert.deepEqual(getAvailableOperators(5), ["+", "-"]);
  assert.deepEqual(getAvailableOperators(9), ["+", "-", "*"]);
  assert.deepEqual(getAvailableOperators(12), ["+", "-", "*", "/"]);
});

test("generatePuzzle keeps row math valid and hides cells by level", () => {
  const puzzle = generatePuzzle(
    12,
    createDeterministicRandom(0.99, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.2, 0.4, 0.6),
  );

  assert.equal(puzzle.grid.length, 3);
  assert.equal(
    puzzle.grid.flat().filter((cell) => cell.isMissing).length,
    getRowsToHideCount(12),
  );
  assert.ok(
    puzzle.grid.every((row) =>
      doesRowMatchOperator(
        row.map((cell) => cell.value),
        puzzle.operator,
      ),
    ),
  );
});

test("appendDigitToCell caps input length and deleteDigitFromCell removes the tail", () => {
  const grid: GridMatrix = [
    [
      { col: 0, isMissing: true, row: 0, userValue: "12", value: 12 },
      { col: 1, isMissing: false, row: 0, value: 3 },
      { col: 2, isMissing: false, row: 0, value: 15 },
    ],
    [
      { col: 0, isMissing: false, row: 1, value: 4 },
      { col: 1, isMissing: false, row: 1, value: 5 },
      { col: 2, isMissing: false, row: 1, value: 9 },
    ],
    [
      { col: 0, isMissing: false, row: 2, value: 7 },
      { col: 1, isMissing: false, row: 2, value: 8 },
      { col: 2, isMissing: false, row: 2, value: 15 },
    ],
  ];

  const appendedGrid = appendDigitToCell(grid, { c: 0, r: 0 }, "3");
  assert.equal(appendedGrid[0][0].userValue, "123");

  const cappedGrid = appendDigitToCell(appendedGrid, { c: 0, r: 0 }, "4");
  assert.equal(cappedGrid[0][0].userValue, "123");

  const deletedGrid = deleteDigitFromCell(cappedGrid, { c: 0, r: 0 });
  assert.equal(deletedGrid[0][0].userValue, "12");
});

test("validatePuzzle distinguishes empty, wrong and correct submissions", () => {
  const incompleteGrid: GridMatrix = [
    [
      { col: 0, isMissing: true, row: 0, value: 12 },
      { col: 1, isMissing: false, row: 0, value: 3 },
      { col: 2, isMissing: false, row: 0, value: 15 },
    ],
  ];
  assert.deepEqual(validatePuzzle(incompleteGrid), {
    allCorrect: false,
    anyFilled: false,
    anyWrong: false,
  });

  const wrongGrid: GridMatrix = [
    [
      { col: 0, isMissing: true, row: 0, userValue: "13", value: 12 },
      { col: 1, isMissing: false, row: 0, value: 3 },
      { col: 2, isMissing: false, row: 0, value: 15 },
    ],
  ];
  assert.deepEqual(validatePuzzle(wrongGrid), {
    allCorrect: false,
    anyFilled: true,
    anyWrong: true,
  });

  const correctGrid: GridMatrix = [
    [
      { col: 0, isMissing: true, row: 0, userValue: "12", value: 12 },
      { col: 1, isMissing: false, row: 0, value: 3 },
      { col: 2, isMissing: false, row: 0, value: 15 },
    ],
  ];
  assert.deepEqual(validatePuzzle(correctGrid), {
    allCorrect: true,
    anyFilled: true,
    anyWrong: false,
  });
});

test("score scales with level", () => {
  assert.equal(calculateMathGridScore(6), 60);
});
