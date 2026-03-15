import assert from "node:assert/strict";
import test from "node:test";

import { buildEmojiStroopFeedbackMessage } from "../../../../src/components/BrainTrainer/emojiStroop/logic.ts";

test("emoji stroop feedback helper explains success and failure clearly", () => {
  assert.equal(
    buildEmojiStroopFeedbackMessage(true, "Mutlu", 3, 20),
    "Doğru duygu: Mutlu. Şimdi 4. seviyeye geçiyorsun.",
  );
  assert.equal(
    buildEmojiStroopFeedbackMessage(true, "Şaşkın", 20, 20),
    "Doğru duygu: Şaşkın. Son turu da geçtin, oyun tamamlanıyor.",
  );
  assert.equal(
    buildEmojiStroopFeedbackMessage(false, "Üzgün", 7, 20),
    "Yanlış seçim! Emoji Üzgün duygusunu gösteriyor.",
  );
});
