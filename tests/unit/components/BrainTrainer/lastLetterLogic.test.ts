import assert from "node:assert/strict";
import test from "node:test";

import {
  calcAnswer,
  checkAnswer,
  computeScore,
  generateDistractors,
  generatePuzzle,
  getItemCountForLevel,
  shuffle,
} from "../../../../src/components/BrainTrainer/lastLetter/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("calcAnswer takes the last letter of each word and uppercases them", () => {
  assert.equal(calcAnswer(["Kitap", "Masa", "Kalem"]), "PAM");
  assert.equal(calcAnswer(["Elma"]), "A");
  assert.equal(calcAnswer(["At", "Su"]), "TU");
});

test("getItemCountForLevel increases with level bands", () => {
  assert.equal(getItemCountForLevel(1), 3);
  assert.equal(getItemCountForLevel(5), 3);
  assert.equal(getItemCountForLevel(6), 4);
  assert.equal(getItemCountForLevel(12), 4);
  assert.equal(getItemCountForLevel(13), 5);
  assert.equal(getItemCountForLevel(20), 5);
});

test("shuffle produces a permutation of the same elements", () => {
  const original = [1, 2, 3, 4, 5];
  const shuffled = shuffle(original, createSeededRandom(42));
  assert.equal(shuffled.length, original.length);
  assert.deepEqual(shuffled.sort((a, b) => a - b), [1, 2, 3, 4, 5]);
});

test("shuffle does not mutate the original array", () => {
  const original = [10, 20, 30];
  const copy = [...original];
  shuffle(original, createSeededRandom(7));
  assert.deepEqual(original, copy);
});

test("generateDistractors returns exactly 4 options including the correct answer", () => {
  const correct = "PMM";
  const options = generateDistractors(correct, createSeededRandom(42));
  assert.equal(options.length, 4);
  assert.ok(options.includes(correct));
  assert.equal(new Set(options).size, 4);
});

test("generateDistractors produces distractors different from the correct answer", () => {
  const correct = "AB";
  const options = generateDistractors(correct, createSeededRandom(99));
  const distractors = options.filter((o) => o !== correct);
  assert.equal(distractors.length, 3);
  distractors.forEach((d) => assert.notEqual(d, correct));
});

test("generatePuzzle creates a puzzle with correct item count and valid answer", () => {
  for (const level of [1, 6, 13]) {
    const puzzle = generatePuzzle(level, createSeededRandom(level));
    assert.equal(puzzle.items.length, getItemCountForLevel(level));
    const expectedAnswer = calcAnswer(puzzle.items.map((i) => i.text));
    assert.equal(puzzle.correctAnswer, expectedAnswer);
    assert.equal(puzzle.options.length, 4);
    assert.ok(puzzle.options.includes(puzzle.correctAnswer));
  }
});

test("checkAnswer validates the answer against the puzzle", () => {
  const puzzle = generatePuzzle(5, createSeededRandom(42));
  assert.equal(checkAnswer(puzzle.correctAnswer, puzzle), true);
  assert.equal(checkAnswer("WRONG", puzzle), false);
});

test("computeScore uses level multiplier", () => {
  assert.equal(computeScore(1), 10);
  assert.equal(computeScore(10), 100);
  assert.equal(computeScore(20), 200);
});
