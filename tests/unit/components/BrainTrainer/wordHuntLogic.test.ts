import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateWordHuntScore,
  createRound,
  evaluateRound,
  generateItems,
  getLevelConfig,
  makeNGram,
  toggleSelectedItem,
} from "../../../../src/components/BrainTrainer/wordHunt/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("getLevelConfig scales target length and timings by level band", () => {
  assert.deepEqual(getLevelConfig(2), {
    wordLen: 5,
    items: 8,
    roundDur: 4.4,
    flash: 0.6,
    targetLen: 1,
  });
  assert.deepEqual(getLevelConfig(9), {
    wordLen: 6,
    items: 9,
    roundDur: 3.5,
    flash: 0.55,
    targetLen: 2,
  });
  assert.deepEqual(getLevelConfig(18), {
    wordLen: 8,
    items: 12,
    roundDur: 2.5,
    flash: 0.4,
    targetLen: 3,
  });
});

test("makeNGram creates a target with the requested length", () => {
  const target = makeNGram(4, createSeededRandom(21));
  assert.equal(target.length, 4);
});

test("generateItems keeps target inclusion aligned with hasTarget", () => {
  const items = generateItems("AR", 6, 8, createSeededRandom(77));
  const targetItems = items.filter((item) => item.hasTarget);

  assert.ok(targetItems.length >= 2);
  assert.ok(targetItems.every((item) => item.text.includes("AR")));
  assert.ok(items.filter((item) => !item.hasTarget).every((item) => !item.text.includes("AR")));
});

test("createRound packages target, items and selection limit", () => {
  const round = createRound(12, createSeededRandom(99));
  const targetCount = round.items.filter((item) => item.hasTarget).length;

  assert.equal(round.config.wordLen, 7);
  assert.equal(round.items.length, 10);
  assert.equal(round.target.length, round.config.targetLen);
  assert.equal(round.maxSelections, targetCount + 2);
});

test("toggleSelectedItem respects deselect and selection cap", () => {
  const first = toggleSelectedItem(new Set<string>(), "a", 2);
  const second = toggleSelectedItem(first, "b", 2);
  const capped = toggleSelectedItem(second, "c", 2);

  assert.deepEqual([...first], ["a"]);
  assert.deepEqual([...second].sort(), ["a", "b"]);
  assert.equal(capped, second);
  assert.deepEqual([...toggleSelectedItem(second, "a", 2)], ["b"]);
});

test("evaluateRound requires all targets and at most one wrong pick", () => {
  const items = [
    { id: "a", text: "KARAR", hasTarget: true },
    { id: "b", text: "TARIM", hasTarget: true },
    { id: "c", text: "MUTLU", hasTarget: false },
  ];
  const success = evaluateRound(items, new Set(["a", "b", "c"]));
  const failure = evaluateRound(items, new Set(["a"]));

  assert.equal(success.isSuccess, true);
  assert.equal(success.correctSelections, 2);
  assert.equal(success.incorrectSelections, 1);
  assert.equal(failure.isSuccess, false);
});

test("calculateWordHuntScore preserves the original formula", () => {
  assert.equal(calculateWordHuntScore(6, 4, 1), 75);
});
