import assert from "node:assert/strict";
import test from "node:test";

import {
  checkAnswer,
  computeScore,
  formatSentence,
  parseQuestions,
} from "../../../../src/components/BrainTrainer/sentenceSynonym/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

const SAMPLE_DATA = [
  {
    id: 1,
    cumle: "'Hızlı koştu' cümlesindeki altı çizili kelimenin eş anlamlısı nedir?",
    secenek_a: "Çabuk",
    secenek_b: "Yavaş",
    secenek_c: "Ağır",
    secenek_d: "Hafif",
    dogru_cevap: "a",
    dogru_kelime: "Hızlı",
  },
  {
    id: 2,
    cumle: "'Büyük ev' cümlesindeki altı çizili kelimenin eş anlamlısı nedir?",
    secenek_a: "Küçük",
    secenek_b: "Geniş",
    secenek_c: "Dar",
    secenek_d: "İnce",
    dogru_cevap: "b",
    dogru_kelime: "Büyük",
  },
];

test("parseQuestions returns shuffled questions with four options each", () => {
  const questions = parseQuestions(SAMPLE_DATA, 20, createSeededRandom(42));
  assert.equal(questions.length, 2);

  questions.forEach((q) => {
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map((o) => o.id)).size, 4);
    assert.ok(["a", "b", "c", "d"].includes(q.correct_option_id));
    assert.ok(typeof q.cumle === "string");
    assert.ok(typeof q.dogru_kelime === "string");
  });
});

test("parseQuestions maps the correct answer to the shuffled position", () => {
  const questions = parseQuestions(SAMPLE_DATA, 20, createSeededRandom(7));

  questions.forEach((q) => {
    const correctOption = q.options.find((o) => o.id === q.correct_option_id);
    assert.ok(correctOption);
  });
});

test("parseQuestions limits output to maxLevel", () => {
  const questions = parseQuestions(SAMPLE_DATA, 1, createSeededRandom(42));
  assert.equal(questions.length, 1);
});

test("checkAnswer validates selected option against the correct one", () => {
  const questions = parseQuestions(SAMPLE_DATA, 20, createSeededRandom(42));
  const q = questions[0];
  assert.equal(checkAnswer(q.correct_option_id, q), true);

  const wrongId = q.options.find((o) => o.id !== q.correct_option_id)!.id;
  assert.equal(checkAnswer(wrongId, q), false);
});

test("computeScore increases with streak", () => {
  assert.equal(computeScore(0), 100);
  assert.equal(computeScore(5), 150);
  assert.equal(computeScore(10), 200);
});

test("formatSentence extracts the quoted sentence from the standard pattern", () => {
  assert.equal(
    formatSentence("'Hızlı koştu' cümlesindeki altı çizili kelimenin eş anlamlısı nedir?"),
    "Hızlı koştu",
  );
});

test("formatSentence returns original text if pattern does not match", () => {
  const plain = "Basit bir cümle";
  assert.equal(formatSentence(plain), plain);
});
