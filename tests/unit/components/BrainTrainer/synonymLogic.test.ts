import assert from "node:assert/strict";
import test from "node:test";

import {
  buildQuestions,
  calculateSynonymScore,
  getErrorActionLabel,
} from "../../../../src/components/BrainTrainer/synonym/logic.ts";
import type { SynonymRow } from "../../../../src/components/BrainTrainer/synonym/types.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

const rows: SynonymRow[] = [
  {
    id: 1,
    kelime: "mutlu",
    secenek_a: "mesut",
    secenek_b: "üzgün",
    secenek_c: "yorgun",
    secenek_d: "kızgın",
    dogru_cevap: "a",
    es_anlami: "mesut",
  },
  {
    id: 2,
    kelime: "hızlı",
    secenek_a: "ağır",
    secenek_b: "seri",
    secenek_c: "sessiz",
    secenek_d: "yavaş",
    dogru_cevap: "b",
    es_anlami: "seri",
  },
];

test("buildQuestions caps rows and remaps the correct option after shuffle", () => {
  const questions = buildQuestions(rows, 1, createSeededRandom(17));

  assert.equal(questions.length, 1);
  assert.equal(questions[0]?.options.length, 4);
  assert.equal(
    questions[0]?.options.some(
      (option) =>
        option.id === questions[0]?.correctOptionId &&
        option.text === questions[0]?.synonym,
    ),
    true,
  );
});

test("buildQuestions skips rows with invalid correct option ids", () => {
  const questions = buildQuestions(
    [
      ...rows,
      {
        ...rows[0],
        id: 99,
        dogru_cevap: "z",
      },
    ],
    3,
    createSeededRandom(5),
  );

  assert.equal(questions.some((question) => question.id === 99), false);
});

test("score and error label helpers preserve the legacy rules", () => {
  assert.equal(calculateSynonymScore(0), 100);
  assert.equal(calculateSynonymScore(3), 130);
  assert.equal(getErrorActionLabel(true), "Devam Et");
  assert.equal(getErrorActionLabel(false), "Geri Dön");
});
