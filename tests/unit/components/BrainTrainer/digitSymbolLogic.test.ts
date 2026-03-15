import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDigitSymbolFeedbackMessage,
  getDigitSymbolTargetScore,
} from "../../../../src/components/BrainTrainer/digitSymbol/logic.ts";

test("digit symbol target score grows with the current level", () => {
  assert.equal(getDigitSymbolTargetScore(1), 5);
  assert.equal(getDigitSymbolTargetScore(4), 6);
  assert.equal(getDigitSymbolTargetScore(8), 7);
  assert.equal(getDigitSymbolTargetScore(20), 10);
});

test("digit symbol feedback helper clarifies each answer outcome", () => {
  assert.equal(
    buildDigitSymbolFeedbackMessage({
      correct: true,
      currentNumber: 7,
      correctSymbol: "★",
      level: 3,
      maxLevel: 20,
      remainingMatches: 2,
    }),
    "Doğru eşleşme: 7 -> ★. Bu seviyede 2 eşleşme daha kaldı.",
  );
  assert.equal(
    buildDigitSymbolFeedbackMessage({
      correct: true,
      currentNumber: 4,
      correctSymbol: "◇",
      level: 20,
      maxLevel: 20,
      remainingMatches: 0,
    }),
    "Doğru eşleşme: 4 -> ◇. Son anahtarı da çözdün, oyun tamamlanıyor.",
  );
  assert.equal(
    buildDigitSymbolFeedbackMessage({
      correct: false,
      currentNumber: 2,
      correctSymbol: "□",
      level: 6,
      maxLevel: 20,
      remainingMatches: 4,
    }),
    "Yanlış eşleşme! 2 rakamının sembolü □ olmalıydı.",
  );
});
