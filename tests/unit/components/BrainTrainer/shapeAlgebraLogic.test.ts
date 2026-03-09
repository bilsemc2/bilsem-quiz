import assert from "node:assert/strict";
import test from "node:test";

import {
  appendAnswerDigit,
  createLevelData,
  deleteAnswerDigit,
  getMaxValueForLevel,
  getQuestionTermCountForLevel,
  getTermsPerEquationForLevel,
  getVariableCountForLevel,
  isCorrectAnswer,
} from "../../../../src/components/BrainTrainer/shapeAlgebra/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("level helpers scale variable and term counts by difficulty", () => {
  assert.equal(getVariableCountForLevel(1), 3);
  assert.equal(getVariableCountForLevel(20), 5);
  assert.equal(getTermsPerEquationForLevel(1), 2);
  assert.equal(getTermsPerEquationForLevel(20), 4);
  assert.equal(getQuestionTermCountForLevel(12), 3);
  assert.equal(getQuestionTermCountForLevel(20), 5);
  assert.equal(getMaxValueForLevel(1), 12);
  assert.equal(getMaxValueForLevel(25), 50);
});

test("createLevelData builds solvable equations and a consistent question", () => {
  const levelData = createLevelData(14, createSeededRandom(12345));
  const variables = new Map(
    levelData.variables.map((variable) => [variable.id, variable.value]),
  );

  assert.equal(levelData.variables.length, 5);
  assert.equal(levelData.equations.length, 4);

  levelData.equations.forEach((equation) => {
    const expectedResult = equation.items.reduce((sum, item) => {
      return sum + (variables.get(item.variableId) ?? 0);
    }, 0);

    assert.equal(equation.result, expectedResult);
  });

  const expectedAnswer = levelData.question.items.reduce((sum, item) => {
    return sum + (variables.get(item.variableId) ?? 0);
  }, 0);

  assert.equal(levelData.question.answer, expectedAnswer);
  assert.equal(levelData.question.text, "Sonuç?");
});

test("answer helpers clamp digits and validate numeric submission", () => {
  assert.equal(appendAnswerDigit("", "4"), "4");
  assert.equal(appendAnswerDigit("47", "8"), "478");
  assert.equal(appendAnswerDigit("478", "9"), "478");
  assert.equal(deleteAnswerDigit("478"), "47");
  assert.equal(isCorrectAnswer(12, "12"), true);
  assert.equal(isCorrectAnswer(12, "13"), false);
});
