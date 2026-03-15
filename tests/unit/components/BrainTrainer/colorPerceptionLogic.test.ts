import assert from "node:assert/strict";
import test from "node:test";

import {
  buildColorPerceptionFeedbackMessage,
  getColorCountForLevel,
  getColorDisplayDuration,
  isColorSelectionCorrect,
} from "../../../../src/components/BrainTrainer/colorPerception/logic.ts";

test("color perception difficulty helpers keep the intended level curve", () => {
  assert.equal(getColorCountForLevel(1), 2);
  assert.equal(getColorCountForLevel(9), 3);
  assert.equal(getColorCountForLevel(14), 4);
  assert.equal(getColorCountForLevel(20), 5);

  assert.equal(getColorDisplayDuration(1), 3850);
  assert.equal(getColorDisplayDuration(15), 1750);
  assert.equal(getColorDisplayDuration(40), 800);
});

test("color perception selection helper compares the visible set order-independently", () => {
  assert.equal(
    isColorSelectionCorrect(["kırmızı", "mavi"], ["mavi", "kırmızı"]),
    true,
  );
  assert.equal(
    isColorSelectionCorrect(["kırmızı"], ["kırmızı", "mavi"]),
    false,
  );
  assert.equal(
    isColorSelectionCorrect(["kırmızı", "yeşil"], ["kırmızı", "mavi"]),
    false,
  );
});

test("color perception feedback helper describes the round outcome", () => {
  assert.equal(
    buildColorPerceptionFeedbackMessage({
      correct: true,
      currentColors: ["kırmızı", "mavi", "sarı"],
      level: 4,
      maxLevel: 20,
    }),
    "Doğru seçim! 3 rengi doğru buldun, şimdi 5. seviyeye geçiyorsun.",
  );
  assert.equal(
    buildColorPerceptionFeedbackMessage({
      correct: true,
      currentColors: ["kırmızı", "mavi", "sarı", "yeşil", "turuncu"],
      level: 20,
      maxLevel: 20,
    }),
    "Harika! 5 rengi doğru hatırladın, oyun tamamlanıyor.",
  );
  assert.equal(
    buildColorPerceptionFeedbackMessage({
      correct: false,
      currentColors: ["kırmızı", "mavi"],
      level: 8,
      maxLevel: 20,
    }),
    "Yanlış seçim! Görmen gereken renkler: kırmızı, mavi.",
  );
});
