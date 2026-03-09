import assert from "node:assert/strict";
import test from "node:test";

import {
  buildQuestions,
  calculateVerbalAnalogyScore,
  getErrorActionLabel,
  mapRowToQuestion,
} from "../../../../src/components/BrainTrainer/verbalAnalogy/logic.ts";
import type { VerbalAnalogyRow } from "../../../../src/components/BrainTrainer/verbalAnalogy/types.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

const createRow = (id: number, overrides: Partial<VerbalAnalogyRow> = {}): VerbalAnalogyRow => ({
  id,
  soru_metni: `Soru ${id}`,
  secenek_a: "A seçeneği",
  secenek_b: "B seçeneği",
  secenek_c: "C seçeneği",
  secenek_d: "D seçeneği",
  dogru_cevap: "c",
  aciklama: "Açıklama",
  ...overrides,
});

test("row mapping preserves correct option after option shuffle", () => {
  const question = mapRowToQuestion(createRow(1), createSeededRandom(12));

  assert.ok(question);
  assert.equal(question.text, "Soru 1");
  assert.equal(question.options.length, 4);
  assert.equal(
    question.options.find((option) => option.id === question.correctOptionId)?.text,
    "C seçeneği",
  );
});

test("invalid rows are skipped when the correct option is unavailable", () => {
  const question = mapRowToQuestion(
    createRow(2, { dogru_cevap: "d", secenek_d: "" }),
    createSeededRandom(8),
  );

  assert.equal(question, null);
});

test("question builder shuffles, filters invalid rows and caps by requested count", () => {
  const rows = [
    createRow(1),
    createRow(2, { dogru_cevap: "d", secenek_d: "" }),
    createRow(3, { dogru_cevap: "a" }),
    createRow(4, { dogru_cevap: "b" }),
  ];
  const questions = buildQuestions(rows, 2, createSeededRandom(99));

  assert.equal(questions.length, 2);
  assert.equal(new Set(questions.map((question) => question.id)).size, 2);
  questions.forEach((question) => {
    assert.equal(question.options.length, 4);
    assert.ok(question.options.some((option) => option.id === question.correctOptionId));
  });
});

test("score and error label helpers preserve the expected rules", () => {
  assert.equal(calculateVerbalAnalogyScore(1), 110);
  assert.equal(calculateVerbalAnalogyScore(7), 170);
  assert.equal(getErrorActionLabel(true), "Devam Et");
  assert.equal(getErrorActionLabel(false), "Geri Dön");
});
