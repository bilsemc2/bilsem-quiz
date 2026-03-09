import assert from "node:assert/strict";
import test from "node:test";

import {
  createOptions,
  createQuestionForLevel,
  generateConditional,
  generateHiddenOperator,
  generateMultiRule,
  generatePairRelation,
  getNumberCipherScore,
  getQuestionTypeLabel,
  safePair,
} from "../../../../src/components/BrainTrainer/numberCipher/logic.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("safePair keeps subtraction pairs non-negative", () => {
  assert.deepEqual(safePair(true, createDeterministicRandom(0, 0.9)), [9, 1]);
});

test("createOptions keeps a unique answer set", () => {
  const options = createOptions(7, createDeterministicRandom(0.1, 0.8, 0.3, 0.6, 0.2, 0.5));

  assert.equal(options.length, 4);
  assert.ok(options.includes(7));
  assert.equal(new Set(options).size, 4);
});

test("question generators return valid answer sets", () => {
  const generators = [
    generateHiddenOperator,
    generatePairRelation,
    generateConditional,
    generateMultiRule,
  ];

  generators.forEach((generator) => {
    const question = generator(
      createDeterministicRandom(0.2, 0.7, 0.4, 0.9, 0.1, 0.3, 0.8, 0.5, 0.6),
    );

    assert.equal(question.options.length, 4);
    assert.ok(question.options.includes(question.answer));
    assert.ok(question.display.length >= 2);
  });
});

test("question type bands follow the original level split", () => {
  assert.equal(createQuestionForLevel(3).type, "hidden_operator");
  assert.equal(createQuestionForLevel(8).type, "pair_relation");
  assert.equal(createQuestionForLevel(14).type, "conditional");
  assert.equal(createQuestionForLevel(18).type, "multi_rule");
});

test("labels and score preserve the legacy rules", () => {
  assert.equal(getQuestionTypeLabel("multi_rule"), "Çoklu Kural");
  assert.equal(getNumberCipherScore(7), 70);
});
