import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPatternDefs,
  createPatternLayer,
  createRound,
  distortColor,
  getPatternCountForLevel,
  getRoundScore,
} from "../../../../src/components/BrainTrainer/partWhole/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("getPatternCountForLevel scales with level and caps at eight", () => {
  assert.equal(getPatternCountForLevel(1), 2);
  assert.equal(getPatternCountForLevel(6), 4);
  assert.equal(getPatternCountForLevel(18), 8);
});

test("createPatternLayer builds defs and keeps foreground distinct", () => {
  const pattern = createPatternLayer(createSeededRandom(7));

  assert.ok(pattern.defs.includes(`<pattern id="${pattern.id}"`));
  assert.notEqual(pattern.backgroundColor, pattern.foregroundColor);
  assert.ok(pattern.opacity >= 0.85 && pattern.opacity <= 1);
});

test("buildPatternDefs renders svg snippets for geometric patterns", () => {
  const defs = buildPatternDefs({
    defs: "",
    type: "star",
    backgroundColor: "#111111",
    foregroundColor: "#eeeeee",
    size: 48,
    rotation: 0,
    opacity: 1,
    id: "p-test",
    props: { points: 6 },
  });

  assert.ok(defs.includes('pattern id="p-test"'));
  assert.ok(defs.includes('fill="#eeeeee"'));
});

test("distortColor adjusts channels deterministically", () => {
  assert.equal(distortColor("#112233", 10, () => 1), "#162738");
  assert.equal(distortColor("#112233", 10, () => 0), "#0c1d2e");
});

test("createRound returns four options with a single correct answer", () => {
  const round = createRound(9, createSeededRandom(42));

  assert.equal(round.gamePattern.length, 5);
  assert.equal(round.options.length, 4);
  assert.equal(round.options.filter((option) => option.isCorrect).length, 1);
  assert.ok(round.targetPos.x >= 0 && round.targetPos.x <= 200);
  assert.ok(round.targetPos.y >= 0 && round.targetPos.y <= 200);
});

test("getRoundScore preserves the original scoring formula", () => {
  assert.equal(getRoundScore(7), 240);
});
