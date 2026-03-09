import assert from "node:assert/strict";
import test from "node:test";

import {
  buildQuestionOptions,
  buildQuestions,
  calculateKnowledgeCardScore,
  createBlankFromSentence,
  getBackLink,
  normalizeAnswer,
} from "../../../../src/components/BrainTrainer/knowledgeCard/logic.ts";

test("createBlankFromSentence prioritizes known keywords", () => {
  const result = createBlankFromSentence("Kalp vücuda kan pompalar.");

  assert.deepEqual(result, {
    displayText: "_____ vücuda kan pompalar.",
    answer: "Kalp",
  });
});

test("createBlankFromSentence falls back to longer eligible words", () => {
  const result = createBlankFromSentence(
    "Uzay için meraklı çocuklar teleskop kullanır.",
    () => 0.99,
  );

  assert.deepEqual(result, {
    displayText: "Uzay için meraklı çocuklar teleskop _____.",
    answer: "kullanır",
  });
});

test("buildQuestionOptions keeps one correct answer and unique distractors", () => {
  const options = buildQuestionOptions(
    "Kalp",
    ["Kalp", "Beyin", "Akciğer", "Kalp", "Böbrek"],
    () => 0.1,
  );

  assert.equal(options.length, 4);
  assert.equal(options.filter((option) => normalizeAnswer(option) === "kalp").length, 1);
  assert.equal(new Set(options.map(normalizeAnswer)).size, 4);
});

test("buildQuestions creates option sets for the requested question count", () => {
  const questions = buildQuestions(
    [
      { id: "1", icerik: "Kalp vücuda kan pompalar." },
      { id: "2", icerik: "Beyin sinir sistemini yönetir." },
      { id: "3", icerik: "Akciğer oksijen alışverişi sağlar." },
      { id: "4", icerik: "Mide besinleri sindirir." },
    ],
    3,
    () => 0.2,
  );

  assert.equal(questions.length, 3);
  assert.ok(questions.every((question) => question.options.length === 4));
  assert.ok(
    questions.every((question) =>
      question.options.some(
        (option) =>
          normalizeAnswer(option) === normalizeAnswer(question.correctAnswer),
      ),
    ),
  );
});

test("score and back link helpers preserve intended rules", () => {
  assert.equal(calculateKnowledgeCardScore(4, 3), 55);
  assert.equal(getBackLink(true), "/bilsem-zeka");
  assert.equal(getBackLink(false), "/atolyeler/bireysel-degerlendirme");
});
