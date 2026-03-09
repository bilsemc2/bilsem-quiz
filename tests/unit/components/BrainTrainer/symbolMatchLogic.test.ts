import assert from "node:assert/strict";
import test from "node:test";

import {
  generateQuestion,
  generateSymbolColors,
  getMemorizeTime,
  getSymbolCount,
  getSymbolMatchScore,
  isCorrectAnswer,
} from "../../../../src/components/BrainTrainer/symbolMatch/logic.ts";
import type { ShapeColorAssignment } from "../../../../src/components/BrainTrainer/symbolMatch/types.ts";

const SAMPLE_PAIRS: ShapeColorAssignment[] = [
  {
    key: "star",
    shapeName: "Yıldız",
    fill: true,
    color: "#ff0000",
    colorName: "Kırmızı",
  },
  {
    key: "circle",
    shapeName: "Daire",
    fill: true,
    color: "#0000ff",
    colorName: "Mavi",
  },
  {
    key: "square",
    shapeName: "Kare",
    fill: true,
    color: "#00ff00",
    colorName: "Yeşil",
  },
  {
    key: "triangle",
    shapeName: "Üçgen",
    fill: true,
    color: "#ffff00",
    colorName: "Sarı",
  },
];

test("level bands keep the original symbol count and memorize time", () => {
  assert.equal(getSymbolCount(1), 4);
  assert.equal(getSymbolCount(10), 5);
  assert.equal(getSymbolCount(20), 6);

  assert.equal(getMemorizeTime(3), 5);
  assert.equal(getMemorizeTime(8), 4);
  assert.equal(getMemorizeTime(13), 3);
  assert.equal(getMemorizeTime(18), 2);
});

test("generateSymbolColors creates unique pairs for the current level", () => {
  const pairs = generateSymbolColors(14, () => 0.25);

  assert.equal(pairs.length, 6);
  assert.equal(new Set(pairs.map((pair) => pair.shapeName)).size, 6);
  assert.equal(new Set(pairs.map((pair) => pair.colorName)).size, 6);
});

test("generateQuestion can ask for the shape behind a color", () => {
  const question = generateQuestion(SAMPLE_PAIRS, () => 0);

  assert.equal(question.type, "color");
  assert.equal(question.query, "Kırmızı renkteki şekil hangisiydi?");
  assert.equal(question.correctAnswer, "Yıldız");
  assert.equal(question.options.length, 4);
  assert.ok(question.options.includes("Yıldız"));
});

test("generateQuestion can ask for the color behind a shape", () => {
  const question = generateQuestion(SAMPLE_PAIRS, () => 0.9);

  assert.equal(question.type, "symbol");
  assert.equal(question.query, "Üçgen hangi renkteydi?");
  assert.equal(question.correctAnswer, "Sarı");
  assert.equal(question.targetShapeName, "Üçgen");
  assert.ok(question.options.includes("Sarı"));
});

test("answer validation and scoring preserve the legacy rules", () => {
  const question = generateQuestion(SAMPLE_PAIRS, () => 0);

  assert.equal(isCorrectAnswer(question, "Yıldız"), true);
  assert.equal(isCorrectAnswer(question, "Daire"), false);
  assert.equal(getSymbolMatchScore(6, 3), 205);
});
