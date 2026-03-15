import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDirectionFeedbackMessage,
  checkAnswer,
  generateRound,
  generateTarget,
  getGridSize,
  getStepsRemaining,
  hasReachedTarget,
  moveTowardTarget,
} from "../../../../src/components/BrainTrainer/directionStroop/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("getGridSize returns 5 for low levels and 7 for high levels", () => {
  assert.equal(getGridSize(1), 5);
  assert.equal(getGridSize(8), 5);
  assert.equal(getGridSize(9), 7);
  assert.equal(getGridSize(20), 7);
});

test("generateRound produces a stroop conflict: word differs from position", () => {
  const random = createSeededRandom(42);

  for (let i = 0; i < 20; i++) {
    const round = generateRound(random);
    assert.ok(typeof round.word === "string");
    assert.ok(["left", "right", "top", "bottom"].includes(round.position));
    assert.notEqual(round.word, round.correctAnswer.toLocaleUpperCase("tr-TR"));
  }
});

test("checkAnswer validates against the correct answer", () => {
  const round = generateRound(createSeededRandom(7));
  assert.equal(checkAnswer(round.correctAnswer, round), true);
  assert.equal(checkAnswer("Yanlış", round), false);
});

test("generateTarget produces a position away from the player", () => {
  const player = { row: 2, col: 2 };
  const target = generateTarget(player, 5, createSeededRandom(99));
  const dist = Math.abs(target.row - player.row) + Math.abs(target.col - player.col);
  assert.ok(dist >= 2);
  assert.ok(target.row >= 0 && target.row < 5);
  assert.ok(target.col >= 0 && target.col < 5);
});

test("moveTowardTarget moves one step closer along the dominant axis", () => {
  const pos = { row: 0, col: 0 };
  const target = { row: 3, col: 1 };

  const next = moveTowardTarget(pos, target);
  assert.equal(next.row, 1);
  assert.equal(next.col, 0);

  const sameSpot = moveTowardTarget(target, target);
  assert.deepEqual(sameSpot, target);
});

test("hasReachedTarget and getStepsRemaining work correctly", () => {
  assert.equal(hasReachedTarget({ row: 2, col: 3 }, { row: 2, col: 3 }), true);
  assert.equal(hasReachedTarget({ row: 0, col: 0 }, { row: 1, col: 1 }), false);
  assert.equal(getStepsRemaining({ row: 0, col: 0 }, { row: 3, col: 4 }), 7);
  assert.equal(getStepsRemaining({ row: 2, col: 2 }, { row: 2, col: 2 }), 0);
});

test("buildDirectionFeedbackMessage covers all cases", () => {
  assert.equal(
    buildDirectionFeedbackMessage(true, false, "Sol", 3, 20),
    "Doğru yön: Sol. Hedefe bir adım daha yaklaştın.",
  );
  assert.equal(
    buildDirectionFeedbackMessage(true, true, "Sağ", 5, 20),
    "Doğru yön! Hedefe ulaştın, 6. seviyeye geçiyorsun.",
  );
  assert.equal(
    buildDirectionFeedbackMessage(true, true, "Yukarı", 20, 20),
    "Harika! Yukarı yönüyle hedefe ulaştın, oyun tamamlanıyor.",
  );
  assert.equal(
    buildDirectionFeedbackMessage(false, false, "Aşağı", 8, 20),
    "Yanlış seçim! Kelimenin anlamına değil aşağı konumuna bakmalıydın.",
  );
});
