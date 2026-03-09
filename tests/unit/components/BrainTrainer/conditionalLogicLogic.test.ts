import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateConditionalLogicScore,
  describeObject,
  evaluateConditionalSelection,
  generateRound,
  getObjectCount,
} from "../../../../src/components/BrainTrainer/conditionalLogic/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("getObjectCount scales by level band", () => {
  assert.equal(getObjectCount(2), 4);
  assert.equal(getObjectCount(8), 6);
  assert.equal(getObjectCount(18), 8);
});

test("generateRound creates a valid target among the rendered objects", () => {
  const easyRound = generateRound(3, createSeededRandom(11));
  const hardRound = generateRound(18, createSeededRandom(99));

  assert.equal(easyRound.objects.length, 4);
  assert.equal(hardRound.objects.length, 8);
  assert.ok(easyRound.objects.some((object) => object.id === easyRound.targetId));
  assert.ok(hardRound.objects.some((object) => object.id === hardRound.targetId));
  assert.match(easyRound.instruction, /^Eğer /);
  assert.match(hardRound.instruction, /^Eğer /);
});

test("generateRound keeps at least two singleton objects for target branching", () => {
  const round = generateRound(10, createSeededRandom(123));
  const comboCounts = round.objects.reduce<Record<string, number>>(
    (counts, object) => {
      const key = `${object.color}-${object.shape}`;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    },
    {},
  );
  const singletonCount = round.objects.filter(
    (object) => comboCounts[`${object.color}-${object.shape}`] === 1,
  ).length;

  assert.ok(singletonCount >= 2);
});

test("describeObject localizes color and shape names", () => {
  assert.equal(
    describeObject({ color: "Blue", shape: "Triangle" }),
    "Mavi Üçgen",
  );
});

test("selection and score helpers stay simple", () => {
  assert.equal(evaluateConditionalSelection("a", "a"), true);
  assert.equal(evaluateConditionalSelection("a", "b"), false);
  assert.equal(calculateConditionalLogicScore(7), 70);
});
