import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateDeyimlerScore,
  createQuestion,
} from "../../../../src/components/BrainTrainer/deyimler/logic.ts";
import type { DeyimRow } from "../../../../src/components/BrainTrainer/deyimler/types.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

const deyimler: DeyimRow[] = [
  { id: 1, deyim: "etekleri zil çalmak", aciklama: "Çok sevinmek", ornek: null },
  { id: 2, deyim: "göz kulak olmak", aciklama: "Koruyup kollamak", ornek: null },
  { id: 3, deyim: "burnundan solumak", aciklama: "Çok öfkeli olmak", ornek: null },
  { id: 4, deyim: "kulak kabartmak", aciklama: "Dikkatle dinlemek", ornek: null },
  { id: 5, deyim: "gözden düşmek", aciklama: "Değerini kaybetmek", ornek: null },
];

test("createQuestion builds a masked idiom and includes the correct option", () => {
  const question = createQuestion(deyimler, createSeededRandom(11));

  assert.ok(question);
  assert.equal(question?.displayText.includes("______"), true);
  assert.equal(question?.options.includes(question?.missingWord ?? ""), true);
});

test("createQuestion returns null when there are not enough idioms", () => {
  assert.equal(createQuestion(deyimler.slice(0, 3), createSeededRandom(3)), null);
});

test("score helper preserves the legacy rule", () => {
  assert.equal(calculateDeyimlerScore(6), 60);
});
