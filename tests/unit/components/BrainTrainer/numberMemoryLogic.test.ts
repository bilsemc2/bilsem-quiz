import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateNumberMemoryScore,
  createMaxQuestion,
  createNumberQuestion,
  createOrderQuestion,
  createQuestion,
  createSumQuestion,
  generateSequence,
  getSequenceLength,
  pickQuestionType,
} from "../../../../src/components/BrainTrainer/numberMemory/logic.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("sequence length scales by level and caps at seven", () => {
  assert.equal(getSequenceLength(1), 3);
  assert.equal(getSequenceLength(8), 5);
  assert.equal(getSequenceLength(20), 7);
});

test("generated sequence uses digit bounds and level-based length", () => {
  const sequence = generateSequence(9, createDeterministicRandom(0, 0.1, 0.2, 0.3, 0.4));

  assert.equal(sequence.length, 5);
  assert.ok(sequence.every((value) => value >= 0 && value <= 9));
});

test("question type stays on number mode until level three", () => {
  assert.equal(pickQuestionType(2), "number");
});

test("number question picks an in-sequence digit and unique options", () => {
  const question = createNumberQuestion([1, 4, 7], createDeterministicRandom(0.1, 0.8, 0.3, 0.6, 0.2, 0.5));

  assert.ok([1, 4, 7].includes(question.answer));
  assert.equal(question.options.length, 4);
  assert.equal(new Set(question.options).size, 4);
});

test("order, sum and max questions preserve their rule semantics", () => {
  const orderQuestion = createOrderQuestion([3, 8, 5], createDeterministicRandom(0.4, 0.1, 0.8, 0.2, 0.6));
  assert.equal(orderQuestion.answer, 8);

  const sumQuestion = createSumQuestion([4, 1, 7], createDeterministicRandom(0, 0.8, 0.2, 0.6, 0.1, 0.5));
  assert.equal(sumQuestion.answer, 11);

  const maxQuestion = createMaxQuestion([4, 1, 7], createDeterministicRandom(0.3, 0.6, 0.2, 0.8));
  assert.equal(maxQuestion.answer, 7);
});

test("question factory and score preserve the original rules", () => {
  const question = createQuestion([2, 5, 9], 16, createDeterministicRandom(0.9, 0.2, 0.7, 0.4, 0.1, 0.5));

  assert.equal(question.type, "max");
  assert.equal(question.options.length, 4);
  assert.equal(calculateNumberMemoryScore(6), 60);
});
