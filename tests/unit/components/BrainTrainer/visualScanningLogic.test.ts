import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCellSelection,
  buildVisualScanningFeedbackMessage,
  calculateVisualScanningScore,
  createRound,
  getDistractorCountForLevel,
  getRemainingTargetCount,
  getTargetCountForLevel,
} from "../../../../src/components/BrainTrainer/visualScanning/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("target and distractor counts follow the original level bands", () => {
  assert.equal(getTargetCountForLevel(1), 6);
  assert.equal(getTargetCountForLevel(4), 8);
  assert.equal(getTargetCountForLevel(8), 10);
  assert.equal(getTargetCountForLevel(12), 12);
  assert.equal(getTargetCountForLevel(18), 14);

  assert.equal(getDistractorCountForLevel(1), 3);
  assert.equal(getDistractorCountForLevel(6), 5);
  assert.equal(getDistractorCountForLevel(12), 7);
  assert.equal(getDistractorCountForLevel(18), 10);
});

test("round generation builds a 64-cell grid with the expected target count", () => {
  const random = createSeededRandom(42);
  const round = createRound(12, random);

  assert.equal(round.cells.length, 64);
  assert.equal(
    round.cells.filter((cell) => cell.isTarget).length,
    getTargetCountForLevel(12),
  );
  assert.equal(
    round.cells.every((cell) => cell.symbol.length > 0),
    true,
  );
});

test("cell selection marks targets and wrong picks while ignoring repeats", () => {
  const round = createRound(1, createSeededRandom(7));
  const targetIndex = round.cells.findIndex((cell) => cell.isTarget);
  const distractorIndex = round.cells.findIndex((cell) => !cell.isTarget);

  const targetSelection = applyCellSelection(round.cells, targetIndex);
  assert.equal(targetSelection.isCorrect, true);
  assert.equal(targetSelection.nextCells[targetIndex].isClicked, true);

  const wrongSelection = applyCellSelection(round.cells, distractorIndex);
  assert.equal(wrongSelection.isCorrect, false);
  assert.equal(wrongSelection.nextCells[distractorIndex].isWrongClick, true);

  const repeatedSelection = applyCellSelection(targetSelection.nextCells, targetIndex);
  assert.equal(repeatedSelection.isIgnored, true);
});

test("remaining counter and score helper preserve legacy rules", () => {
  const round = createRound(1, createSeededRandom(9));
  const targetIndex = round.cells.findIndex((cell) => cell.isTarget);
  const selection = applyCellSelection(round.cells, targetIndex);

  assert.equal(
    getRemainingTargetCount(selection.nextCells),
    getTargetCountForLevel(1) - 1,
  );
  assert.equal(calculateVisualScanningScore(0), 25);
  assert.equal(calculateVisualScanningScore(4), 33);
  assert.equal(calculateVisualScanningScore(20), 45);
});

test("visual scanning feedback helper explains completion and mistakes", () => {
  assert.equal(
    buildVisualScanningFeedbackMessage({
      correct: true,
      remainingTargets: 0,
      level: 5,
      maxLevel: 20,
    }),
    "Harika tarama! Tüm hedefleri buldun, şimdi 6. seviyeye geçiyorsun.",
  );
  assert.equal(
    buildVisualScanningFeedbackMessage({
      correct: true,
      remainingTargets: 0,
      level: 20,
      maxLevel: 20,
    }),
    "Harika tarama! Son hedefi de buldun, oyun tamamlanıyor.",
  );
  assert.equal(
    buildVisualScanningFeedbackMessage({
      correct: true,
      remainingTargets: 3,
      level: 8,
      maxLevel: 20,
    }),
    "Doğru seçim! 3 hedef daha kaldı.",
  );
  assert.equal(
    buildVisualScanningFeedbackMessage({
      correct: false,
      remainingTargets: 7,
      level: 8,
      maxLevel: 20,
    }),
    "Yanlış seçim! Yalnızca hedef sembollere dokunmalısın.",
  );
});
