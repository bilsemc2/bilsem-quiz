import assert from "node:assert/strict";
import test from "node:test";

import type { BaseShape } from "../../../../src/types/matrixRules.ts";
import {
  buildQuestionHistoryEntry,
  createGridWithHiddenCell,
  createOptions,
  createQuestionState,
  getMatrixPuzzleScore,
  pickHiddenCell,
} from "../../../../src/components/BrainTrainer/matrixPuzzle/logic.ts";

const createShape = (id: string, rotation = 0): BaseShape => ({
  id,
  type: "circle",
  fill: "#ff0000",
  rotation,
  scale: 1,
});

test("pickHiddenCell targets the lower-right 2x2 area", () => {
  const minCell = pickHiddenCell(() => 0);
  const maxCell = pickHiddenCell(() => 0.999);

  assert.deepEqual(minCell, { row: 1, col: 1 });
  assert.deepEqual(maxCell, { row: 2, col: 2 });
});

test("createGridWithHiddenCell marks only the selected cell hidden", () => {
  const matrix = [
    [createShape("a"), createShape("b"), createShape("c")],
    [createShape("d"), createShape("e"), createShape("f")],
    [createShape("g"), createShape("h"), createShape("i")],
  ];
  const grid = createGridWithHiddenCell(matrix, 2, 1);

  assert.equal(grid[2][1].isHidden, true);
  assert.equal(grid[0][0].isHidden, false);
  assert.equal(grid[2][1].shape.id, "h");
});

test("createOptions keeps one correct option and shuffles the list", () => {
  const options = createOptions(
    createShape("correct"),
    [createShape("w1"), createShape("w2")],
    () => 0.9,
  );

  assert.equal(options.length, 3);
  assert.equal(options.filter((option) => option.isCorrect).length, 1);
  assert.ok(options.some((option) => option.shape.id === "correct"));
});

test("createQuestionState packages rule info, grid and options", () => {
  const correctShape = createShape("correct");
  const matrix = [
    [createShape("a"), createShape("b"), createShape("c")],
    [createShape("d"), correctShape, createShape("f")],
    [createShape("g"), createShape("h"), createShape("i")],
  ];
  const question = createQuestionState({
    matrix,
    hiddenRow: 1,
    hiddenCol: 1,
    rule: {
      id: "rule-1",
      name: "Renk Donusumu",
      description: "Sekiller her satirda renk degistirir.",
      direction: "row",
      difficulty: "easy",
      transformations: [],
    },
    wrongShapes: [createShape("w1"), createShape("w2")],
    random: () => 0,
  });

  assert.equal(question.correctAnswer.id, "correct");
  assert.equal(question.grid[1][1].isHidden, true);
  assert.equal(question.ruleName, "Renk Donusumu");
  assert.equal(question.options.length, 3);
});

test("buildQuestionHistoryEntry clones cells and preserves answer metadata", () => {
  const question = createQuestionState({
    matrix: [
      [createShape("a"), createShape("b"), createShape("c")],
      [createShape("d"), createShape("e"), createShape("f")],
      [createShape("g"), createShape("h"), createShape("i")],
    ],
    hiddenRow: 1,
    hiddenCol: 1,
    rule: {
      id: "rule-1",
      name: "Sekil Degisimi",
      description: "Sekiller saat yonunde doner.",
      direction: "row",
      difficulty: "easy",
      transformations: [],
    },
    wrongShapes: [createShape("w1")],
    random: () => 0,
  });
  const historyEntry = buildQuestionHistoryEntry({
    question,
    level: 7,
    selectedAnswer: createShape("selected"),
    isCorrect: false,
  });

  assert.equal(historyEntry.level, 7);
  assert.equal(historyEntry.correctAnswer.id, "e");
  assert.equal(historyEntry.selectedAnswer.id, "selected");
  assert.notEqual(historyEntry.grid[0][0], question.grid[0][0]);
});

test("getMatrixPuzzleScore preserves the legacy scoring formula", () => {
  assert.equal(getMatrixPuzzleScore(8), 80);
});
