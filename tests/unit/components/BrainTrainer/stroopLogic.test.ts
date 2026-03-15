import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStroopFeedbackMessage,
  checkAnswer,
  COLORS,
  computeScore,
  generateRound,
  shouldFinishGame,
  shouldLevelUp,
} from "../../../../src/components/BrainTrainer/stroop/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("generateRound produces four unique options including the correct answer", () => {
  const random = createSeededRandom(42);

  for (let i = 0; i < 20; i++) {
    const round = generateRound(random);
    assert.equal(round.options.length, 4);
    assert.equal(new Set(round.options).size, 4);
    assert.ok(round.options.includes(round.correctAnswer));
    assert.ok(COLORS.some((c) => c.name === round.word));
    assert.ok(COLORS.some((c) => c.hex === round.textColor));
  }
});

test("generateRound correctAnswer matches the text color name", () => {
  const round = generateRound(createSeededRandom(7));
  const matchedColor = COLORS.find((c) => c.hex === round.textColor);
  assert.ok(matchedColor);
  assert.equal(round.correctAnswer, matchedColor.name);
});

test("checkAnswer validates the selected answer", () => {
  const round = generateRound(createSeededRandom(99));
  assert.equal(checkAnswer(round.correctAnswer, round), true);
  assert.equal(checkAnswer("YANLIS", round), false);
});

test("computeScore combines level and streak", () => {
  assert.equal(computeScore(1, 0), 20);
  assert.equal(computeScore(5, 4), 120);
  assert.equal(computeScore(10, 10), 250);
});

test("shouldLevelUp triggers every 8 correct answers below max level", () => {
  assert.equal(shouldLevelUp(8, 5, 20), true);
  assert.equal(shouldLevelUp(16, 10, 20), true);
  assert.equal(shouldLevelUp(7, 5, 20), false);
  assert.equal(shouldLevelUp(0, 1, 20), false);
  assert.equal(shouldLevelUp(8, 20, 20), false);
});

test("shouldFinishGame triggers at 8 correct answers on max level", () => {
  assert.equal(shouldFinishGame(8, 20, 20), true);
  assert.equal(shouldFinishGame(16, 20, 20), true);
  assert.equal(shouldFinishGame(8, 19, 20), false);
  assert.equal(shouldFinishGame(0, 20, 20), false);
});

test("buildStroopFeedbackMessage covers all result variants", () => {
  assert.equal(
    buildStroopFeedbackMessage({ correct: true, levelUp: false, finish: false, level: 5 }),
    "Doğru renk! Kelimeye değil yazı rengine odaklandın.",
  );
  assert.equal(
    buildStroopFeedbackMessage({ correct: true, levelUp: true, finish: false, level: 5 }),
    "Doğru renk! 6. seviyeye geçiyorsun.",
  );
  assert.equal(
    buildStroopFeedbackMessage({ correct: true, levelUp: false, finish: true, level: 20 }),
    "Doğru renk! Son bölümü tamamladın.",
  );
  assert.equal(
    buildStroopFeedbackMessage({ correct: false, levelUp: false, finish: false, level: 3 }),
    "Yanlış seçim! Kelimeye değil yazının rengine bak.",
  );
});
