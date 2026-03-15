import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCosmicMemoryFeedbackMessage,
  calculateCosmicMemoryScore,
  createRound,
  getDisplayTime,
  getExpectedCell,
  getGridSize,
  getPauseTime,
  getSequenceLength,
  isSequenceComplete,
  pickGameMode,
} from "../../../../src/components/BrainTrainer/cosmicMemory/logic.ts";

test("grid size scales across the original level bands", () => {
  assert.equal(getGridSize(1), 3);
  assert.equal(getGridSize(5), 3);
  assert.equal(getGridSize(6), 4);
  assert.equal(getGridSize(12), 4);
  assert.equal(getGridSize(13), 5);
});

test("sequence length and display timings preserve the legacy rules", () => {
  assert.equal(getSequenceLength(1), 2);
  assert.equal(getSequenceLength(5), 4);
  assert.equal(getSequenceLength(20), 10);
  assert.equal(getDisplayTime(1), 960);
  assert.equal(getDisplayTime(20), 400);
  assert.equal(getPauseTime(1), 380);
  assert.equal(getPauseTime(20), 200);
});

test("reverse mode unlocks after level seven and round generation matches the grid", () => {
  assert.equal(pickGameMode(7, 0.9), "NORMAL");
  assert.equal(pickGameMode(8, 0.2), "NORMAL");
  assert.equal(pickGameMode(8, 0.9), "REVERSE");

  const round = createRound(10, () => 0.1);

  assert.equal(round.gridSize, 4);
  assert.equal(round.sequence.length, getSequenceLength(10));
  assert.ok(round.sequence.every((value) => value >= 0 && value < 16));
});

test("expected cell resolution supports normal and reverse order", () => {
  const sequence = [1, 4, 7, 3];

  assert.equal(getExpectedCell(sequence, 0, "NORMAL"), 1);
  assert.equal(getExpectedCell(sequence, 1, "NORMAL"), 4);
  assert.equal(getExpectedCell(sequence, 0, "REVERSE"), 3);
  assert.equal(getExpectedCell(sequence, 2, "REVERSE"), 4);
  assert.equal(isSequenceComplete(sequence, 3), false);
  assert.equal(isSequenceComplete(sequence, 4), true);
});

test("score formula preserves the original level multiplier", () => {
  assert.equal(calculateCosmicMemoryScore(1), 10);
  assert.equal(calculateCosmicMemoryScore(9), 90);
});

test("cosmic memory feedback helper explains forward and reverse rounds", () => {
  assert.equal(
    buildCosmicMemoryFeedbackMessage({
      correct: true,
      level: 6,
      maxLevel: 20,
      mode: "NORMAL",
    }),
    "Doğru sıra! Şimdi 7. seviyeye geçiyorsun.",
  );
  assert.equal(
    buildCosmicMemoryFeedbackMessage({
      correct: false,
      level: 9,
      maxLevel: 20,
      mode: "REVERSE",
    }),
    "Yanlış hücre! Bu turda diziyi tersten hatırlamalıydın.",
  );
  assert.equal(
    buildCosmicMemoryFeedbackMessage({
      correct: true,
      level: 20,
      maxLevel: 20,
      mode: "NORMAL",
    }),
    "Harika hafıza! Son diziyi de doğru tamamladın, oyun bitiyor.",
  );
});
