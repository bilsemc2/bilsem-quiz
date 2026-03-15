import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPencilStroopFeedbackMessage,
  calculatePencilStroopScore,
  createRound,
  isAnswerCorrect,
} from "../../../../src/components/BrainTrainer/pencilStroop/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("round generation preserves the original stroop constraints", () => {
  const random = createSeededRandom(42);

  for (let index = 0; index < 25; index += 1) {
    const round = createRound(random);
    const optionNames = round.options.map((option) => option.name);

    assert.equal(round.correctAnswer, round.pencilColorObj.name);
    assert.notEqual(round.wordObj.name, round.pencilColorObj.name);
    assert.notEqual(round.labelTextColor.name, round.pencilColorObj.name);
    assert.notEqual(round.labelTextColor.name, round.wordObj.name);
    assert.equal(round.options.length, 4);
    assert.equal(new Set(optionNames).size, 4);
    assert.equal(optionNames.includes(round.correctAnswer), true);
    assert.equal(round.optionStyles.length, 4);

    round.optionStyles.forEach((style, optionIndex) => {
      const option = round.options[optionIndex];
      assert.notEqual(style.textColor.name, option.name);
      assert.notEqual(style.bgColor.name, style.textColor.name);
    });
  }
});

test("score and answer helpers keep the legacy rules", () => {
  const round = createRound(createSeededRandom(7));

  assert.equal(calculatePencilStroopScore(1), 25);
  assert.equal(calculatePencilStroopScore(8), 60);
  assert.equal(isAnswerCorrect(round.correctAnswer, round), true);
  assert.equal(isAnswerCorrect("Yanlis", round), false);
  assert.equal(isAnswerCorrect(round.correctAnswer, null), false);
});

test("feedback message helper explains the active pencil stroop result", () => {
  assert.equal(
    buildPencilStroopFeedbackMessage(true, "Mavi", 3),
    "Doğru renk: Mavi. Şimdi 4. seviyeye geçiyorsun.",
  );
  assert.equal(
    buildPencilStroopFeedbackMessage(true, "Kırmızı", 20),
    "Doğru renk: Kırmızı. Son turu da geçtin, oyun tamamlanıyor.",
  );
  assert.equal(
    buildPencilStroopFeedbackMessage(false, "Yeşil", 6),
    "Yanlış seçim! Kalemin gerçek rengi Yeşil olmalıydı.",
  );
});
