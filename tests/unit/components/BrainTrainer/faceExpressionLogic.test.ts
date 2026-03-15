import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFaceExpressionFeedbackMessage,
  checkAnswer,
  computeScore,
  EMOTIONS,
  EXPRESSION_VARIANTS,
  generateQuestion,
} from "../../../../src/components/BrainTrainer/faceExpression/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("generateQuestion returns four unique options including the correct one", () => {
  const random = createSeededRandom(42);

  for (let i = 0; i < 20; i++) {
    const q = generateQuestion(random);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map((o) => o.id)).size, 4);
    assert.ok(q.options.some((o) => o.id === q.correctEmotion.id));
    assert.ok(EXPRESSION_VARIANTS[q.correctEmotion.id].includes(q.emoji));
  }
});

test("generateQuestion emoji is a valid variant of the correct emotion", () => {
  const q = generateQuestion(createSeededRandom(7));
  const variants = EXPRESSION_VARIANTS[q.correctEmotion.id];
  assert.ok(variants.includes(q.emoji));
});

test("checkAnswer validates the selected emotion id", () => {
  const q = generateQuestion(createSeededRandom(99));
  assert.equal(checkAnswer(q.correctEmotion.id, q), true);
  assert.equal(checkAnswer("nonexistent-emotion", q), false);

  const wrongEmotion = EMOTIONS.find((e) => e.id !== q.correctEmotion.id);
  assert.equal(checkAnswer(wrongEmotion!.id, q), false);
});

test("computeScore combines level and streak", () => {
  assert.equal(computeScore(1, 0), 10);
  assert.equal(computeScore(5, 3), 65);
  assert.equal(computeScore(10, 10), 150);
});

test("buildFaceExpressionFeedbackMessage explains correct and wrong results", () => {
  assert.equal(
    buildFaceExpressionFeedbackMessage(true, "Mutlu", 5, 20),
    "Doğru duygu: Mutlu. Şimdi 6. seviyeye geçiyorsun.",
  );
  assert.equal(
    buildFaceExpressionFeedbackMessage(true, "Kızgın", 20, 20),
    "Harika! Kızgın ifadesini doğru tanıdın, oyun tamamlanıyor.",
  );
  assert.equal(
    buildFaceExpressionFeedbackMessage(false, "Üzgün", 3, 20),
    "Yanlış seçim! Bu ifade Üzgün duygusunu gösteriyor.",
  );
});
