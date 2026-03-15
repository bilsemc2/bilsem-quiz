import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCreatureLogicScore,
  createEasyRule,
  createMediumRule,
  evaluateSelection,
  generateCreatures,
  generateRound,
  getCreatureCount,
  getCreatureDifficulty,
  getCreatureTraitLines,
  toggleCreatureSelection,
} from "../../../../src/components/BrainTrainer/creatureLogic/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("getCreatureDifficulty maps levels to easy/medium/hard bands", () => {
  assert.equal(getCreatureDifficulty(1), "easy");
  assert.equal(getCreatureDifficulty(6), "easy");
  assert.equal(getCreatureDifficulty(7), "medium");
  assert.equal(getCreatureDifficulty(13), "medium");
  assert.equal(getCreatureDifficulty(14), "hard");
  assert.equal(getCreatureDifficulty(20), "hard");
});

test("getCreatureCount increases by level band", () => {
  assert.equal(getCreatureCount(1), 6);
  assert.equal(getCreatureCount(5), 6);
  assert.equal(getCreatureCount(6), 9);
  assert.equal(getCreatureCount(12), 9);
  assert.equal(getCreatureCount(13), 12);
  assert.equal(getCreatureCount(20), 12);
});

test("generateCreatures produces the requested count with unique ids", () => {
  const creatures = generateCreatures(8, createSeededRandom(42));
  assert.equal(creatures.length, 8);
  assert.equal(new Set(creatures.map((c) => c.id)).size, 8);

  creatures.forEach((c) => {
    assert.ok(c.id >= 1 && c.id <= 8);
    assert.ok(typeof c.color === "string");
    assert.ok(typeof c.shape === "string");
    assert.ok(typeof c.accessory === "string");
    assert.ok(typeof c.emotion === "string");
  });
});

test("createEasyRule returns a rule with instruction and a working predicate", () => {
  const rule = createEasyRule(createSeededRandom(10));
  assert.ok(typeof rule.instruction === "string");
  assert.ok(rule.instruction.length > 0);
  assert.ok(typeof rule.predicate === "function");
});

test("createMediumRule returns a compound rule", () => {
  const rule = createMediumRule(createSeededRandom(20));
  assert.ok(typeof rule.instruction === "string");
  assert.ok(rule.instruction.length > 0);
  assert.ok(typeof rule.predicate === "function");
});

test("generateRound always has at least one target creature", () => {
  for (const level of [1, 7, 14, 20]) {
    const round = generateRound(level, createSeededRandom(level * 3));
    assert.ok(round.targetIds.length > 0);
    assert.ok(round.creatures.length > 0);
    assert.ok(typeof round.instruction === "string");
    assert.equal(round.difficulty, getCreatureDifficulty(level));
  }
});

test("toggleCreatureSelection adds and removes ids", () => {
  assert.deepEqual(toggleCreatureSelection([], 1), [1]);
  assert.deepEqual(toggleCreatureSelection([1, 2], 3), [1, 2, 3]);
  assert.deepEqual(toggleCreatureSelection([1, 2, 3], 2), [1, 3]);
  assert.deepEqual(toggleCreatureSelection([5], 5), []);
});

test("evaluateSelection checks exact match of selected and target ids", () => {
  assert.equal(evaluateSelection([1, 2], [1, 2]), true);
  assert.equal(evaluateSelection([2, 1], [1, 2]), true);
  assert.equal(evaluateSelection([1], [1, 2]), false);
  assert.equal(evaluateSelection([1, 2, 3], [1, 2]), false);
  assert.equal(evaluateSelection([], []), true);
});

test("getCreatureTraitLines produces four descriptive lines", () => {
  const creature = {
    id: 1,
    color: "red" as const,
    shape: "fluff" as const,
    accessory: "hat" as const,
    emotion: "happy" as const,
  };
  const lines = getCreatureTraitLines(creature);
  assert.equal(lines.length, 4);
  assert.ok(lines[0].startsWith("Renk:"));
  assert.ok(lines[1].startsWith("Tip:"));
  assert.ok(lines[2].startsWith("Aksesuar:"));
  assert.ok(lines[3].startsWith("Duygu:"));
});

test("calculateCreatureLogicScore uses the level multiplier", () => {
  assert.equal(calculateCreatureLogicScore(1), 10);
  assert.equal(calculateCreatureLogicScore(10), 100);
  assert.equal(calculateCreatureLogicScore(20), 200);
});
