import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateDualBindScore,
  createDualQuestions,
  createRound,
  createSymbolColors,
  getAnswerResultDelay,
  getColorHexByName,
  getMemorizeCountdown,
  getPairCountForLevel,
} from "../../../../src/components/BrainTrainer/dualBind/logic.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;

  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("pair count and memorize countdown preserve the legacy level bands", () => {
  assert.equal(getPairCountForLevel(1), 3);
  assert.equal(getPairCountForLevel(8), 4);
  assert.equal(getPairCountForLevel(20), 5);

  assert.equal(getMemorizeCountdown(1), 7);
  assert.equal(getMemorizeCountdown(8), 5);
  assert.equal(getMemorizeCountdown(20), 3);
  assert.equal(getAnswerResultDelay(), 1200);
});

test("symbol color generation keeps unique symbols and colors per round", () => {
  const pairs = createSymbolColors(
    8,
    createDeterministicRandom(0.1, 0.5, 0.9, 0.2, 0.3, 0.7, 0.4, 0.8, 0.6),
  );

  assert.equal(pairs.length, 4);
  assert.equal(new Set(pairs.map((pair) => pair.symbol)).size, 4);
  assert.equal(new Set(pairs.map((pair) => pair.colorName)).size, 4);
});

test("dual question generation builds both directions for one target pair", () => {
  const questions = createDualQuestions(
    [
      { color: "#111", colorName: "Kırmızı", symbol: "⭐" },
      { color: "#222", colorName: "Mavi", symbol: "▲" },
      { color: "#333", colorName: "Yeşil", symbol: "●" },
    ],
    createDeterministicRandom(0, 0.3, 0.6, 0.9),
  );

  assert.equal(questions.length, 2);
  assert.equal(questions[0]?.type, "color-to-symbol");
  assert.equal(questions[0]?.correctAnswer, "⭐");
  assert.equal(questions[0]?.options.length, 3);
  assert.ok(questions[0]?.options.includes("⭐"));

  assert.equal(questions[1]?.type, "symbol-to-color");
  assert.equal(questions[1]?.correctAnswer, "Kırmızı");
  assert.equal(questions[1]?.options.length, 3);
  assert.ok(questions[1]?.options.includes("Kırmızı"));
});

test("round generation packages memorize state, pairs and question set", () => {
  const round = createRound(
    13,
    createDeterministicRandom(0.1, 0.5, 0.9, 0.2, 0.3, 0.7, 0.4, 0.8, 0.6),
  );

  assert.equal(round.countdown, 4);
  assert.equal(round.symbolColors.length, 5);
  assert.equal(round.questions.length, 2);
});

test("score formula and color lookup preserve the legacy rules", () => {
  assert.equal(calculateDualBindScore(1, 1), 15);
  assert.equal(calculateDualBindScore(6, 4), 80);
  assert.ok(getColorHexByName("Mavi"));
  assert.equal(getColorHexByName("Bilinmiyor"), null);
});
