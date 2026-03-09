import assert from "node:assert/strict";
import test from "node:test";

import { COLORS } from "../../../../src/components/BrainTrainer/mathMagic/constants.ts";
import {
  appendDigit,
  createRoundCards,
  generateQuestion,
  getCardCountForLevel,
  getRoundSequencePlan,
  isAnswerCorrect,
} from "../../../../src/components/BrainTrainer/mathMagic/logic.ts";
import { QUESTION_TYPES, type GameCardData } from "../../../../src/components/BrainTrainer/mathMagic/types.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

const createSequenceRandom = (...values: number[]) => {
  let index = 0;

  return () => {
    const next = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return next;
  };
};

const sampleCards: GameCardData[] = [
  { id: "a", number: 3, color: COLORS[0] },
  { id: "b", number: 7, color: COLORS[1] },
  { id: "c", number: 2, color: COLORS[2] },
];

test("getCardCountForLevel grows with level and caps at six", () => {
  assert.equal(getCardCountForLevel(1), 2);
  assert.equal(getCardCountForLevel(12), 5);
  assert.equal(getCardCountForLevel(20), 6);
});

test("getRoundSequencePlan clamps reveal and display timings", () => {
  assert.deepEqual(getRoundSequencePlan(4, 1), {
    initialFocusDelay: 800,
    revealDelay: 780,
    allCardsOpenAt: 3920,
    displayTime: 1950,
    closeAllAt: 5870,
    questionAt: 6670,
  });

  assert.equal(getRoundSequencePlan(6, 20).revealDelay, 600);
  assert.equal(getRoundSequencePlan(6, 20).displayTime, 1200);
});

test("createRoundCards returns level-sized cards from the shared color palette", () => {
  const cards = createRoundCards(9, createSeededRandom(12345));

  assert.equal(cards.length, 4);
  assert.ok(cards.every((card) => Number.isInteger(card.number)));
  assert.ok(cards.every((card) => card.number >= 0 && card.number <= 13));
  assert.ok(cards.every((card) => COLORS.some((color) => color.name === card.color.name)));
});

test("generateQuestion can produce color and addition prompts deterministically", () => {
  const colorQuestion = generateQuestion(sampleCards, createSequenceRandom(0.3, 0.1));
  assert.deepEqual(colorQuestion, {
    type: QUESTION_TYPES.COLOR,
    text: "İşaretli kartın rengi neydi?",
    answer: "Kırmızı",
    targetIndices: [0],
  });

  const additionQuestion = generateQuestion(sampleCards, createSequenceRandom(0.55, 0.4));
  assert.deepEqual(additionQuestion, {
    type: QUESTION_TYPES.ADDITION,
    text: "İşaretli kartların toplamı nedir?",
    answer: 9,
    targetIndices: [1, 2],
  });
});

test("isAnswerCorrect normalizes case and numeric values", () => {
  assert.equal(
    isAnswerCorrect(
      {
        type: QUESTION_TYPES.COLOR,
        text: "",
        answer: "Yeşil",
        targetIndices: [0],
      },
      "yeşil",
    ),
    true,
  );

  assert.equal(
    isAnswerCorrect(
      {
        type: QUESTION_TYPES.NUMBER,
        text: "",
        answer: 12,
        targetIndices: [0],
      },
      "12",
    ),
    true,
  );
});

test("appendDigit enforces maximum numeric input length", () => {
  assert.equal(appendDigit("", "4"), "4");
  assert.equal(appendDigit("48", "1"), "481");
  assert.equal(appendDigit("481", "9"), "481");
});
