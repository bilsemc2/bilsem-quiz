import assert from "node:assert/strict";
import test from "node:test";

import type { SoundItem } from "../../../../src/components/BrainTrainer/noiseFilterData.ts";
import {
  NUMBER_OF_OPTIONS,
} from "../../../../src/components/BrainTrainer/noiseFilter/constants.ts";
import {
  buildNoiseFilterFeedbackMessage,
  calculateNoiseFilterScore,
  createRound,
  getOptionCountForLevel,
  isNoiseFilterInteractionLocked,
  isAnswerCorrect,
  resolveNoiseFilterSelection,
} from "../../../../src/components/BrainTrainer/noiseFilter/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("level scaling grows option count until the configured maximum", () => {
  assert.equal(getOptionCountForLevel(1), 4);
  assert.equal(getOptionCountForLevel(2), 5);
  assert.equal(getOptionCountForLevel(3), 6);
  assert.equal(getOptionCountForLevel(5), 8);
  assert.equal(getOptionCountForLevel(7), 10);
  assert.equal(getOptionCountForLevel(9), NUMBER_OF_OPTIONS);
  assert.equal(getOptionCountForLevel(99), NUMBER_OF_OPTIONS);
});

test("high-level round generation keeps the target inside a unique ten-option grid", () => {
  const round = createRound(10, undefined, createSeededRandom(42));

  assert.ok(round);
  assert.equal(round.options.length, NUMBER_OF_OPTIONS);
  assert.equal(new Set(round.options.map((sound) => sound.name)).size, NUMBER_OF_OPTIONS);
  assert.equal(
    round.options.some((sound) => sound.name === round.targetSound.name),
    true,
  );
});

test("round generation shrinks gracefully when the pool is smaller than ten items", () => {
  const soundPool: SoundItem[] = [
    { name: "Davul", file: "drum.mp3", image: "drum.webp" },
    { name: "Keman", file: "violin.mp3", image: "violin.webp" },
    { name: "Piyano", file: "piano.mp3", image: "piano.webp" },
  ];
  const round = createRound(6, soundPool, createSeededRandom(7));

  assert.ok(round);
  assert.equal(round.options.length, soundPool.length);
  assert.equal(new Set(round.options.map((sound) => sound.name)).size, soundPool.length);
});

test("early levels start with fewer options than later levels", () => {
  const earlyRound = createRound(1, undefined, createSeededRandom(9));
  const lateRound = createRound(10, undefined, createSeededRandom(9));

  assert.ok(earlyRound);
  assert.ok(lateRound);
  assert.equal(earlyRound.options.length < lateRound.options.length, true);
  assert.equal(earlyRound.options.length, 4);
  assert.equal(lateRound.options.length, NUMBER_OF_OPTIONS);
});

test("score and answer helpers preserve the legacy rules", () => {
  const round = createRound(4, undefined, createSeededRandom(9));

  assert.ok(round);
  assert.equal(calculateNoiseFilterScore(1), 20);
  assert.equal(calculateNoiseFilterScore(6), 120);
  assert.equal(isAnswerCorrect(round.targetSound.name, round), true);
  assert.equal(isAnswerCorrect("Yanlis", round), false);
  assert.equal(isAnswerCorrect("Yanlis", null), false);
});

test("selection resolution locks input and advances on a correct answer", () => {
  const round = createRound(5, undefined, createSeededRandom(11));

  assert.ok(round);
  const resolution = resolveNoiseFilterSelection({
    selectedName: round.targetSound.name,
    round,
    level: 5,
    lives: 3,
  });

  assert.deepEqual(resolution, {
    isCorrect: true,
    scoreDelta: calculateNoiseFilterScore(5),
    shouldAdvanceLevel: true,
    shouldLoseLife: false,
    shouldRetryLevel: false,
    shouldEndGame: false,
  });
  assert.equal(
    buildNoiseFilterFeedbackMessage(resolution, 5, 10, 3),
    "Doğru seçim! 6. seviyeye geçiliyor.",
  );
  assert.equal(isNoiseFilterInteractionLocked(round.targetSound.name, false), true);
});

test("selection resolution retries the same level on a wrong answer while lives remain", () => {
  const round = createRound(5, undefined, createSeededRandom(13));

  assert.ok(round);
  const wrongOption = round.options.find(
    (sound) => sound.name !== round.targetSound.name,
  );

  assert.ok(wrongOption);
  const resolution = resolveNoiseFilterSelection({
    selectedName: wrongOption.name,
    round,
    level: 5,
    lives: 2,
  });

  assert.deepEqual(resolution, {
    isCorrect: false,
    scoreDelta: 0,
    shouldAdvanceLevel: false,
    shouldLoseLife: true,
    shouldRetryLevel: true,
    shouldEndGame: false,
  });
  assert.equal(
    buildNoiseFilterFeedbackMessage(resolution, 5, 10, 2),
    "Yanlış seçim! 1 can kaldı, aynı seviye yeniden başlıyor.",
  );
  assert.equal(isNoiseFilterInteractionLocked(null, true), true);
});

test("selection resolution ends the game on the last life", () => {
  const round = createRound(5, undefined, createSeededRandom(17));

  assert.ok(round);
  const wrongOption = round.options.find(
    (sound) => sound.name !== round.targetSound.name,
  );

  assert.ok(wrongOption);
  const resolution = resolveNoiseFilterSelection({
    selectedName: wrongOption.name,
    round,
    level: 5,
    lives: 1,
  });

  assert.deepEqual(resolution, {
    isCorrect: false,
    scoreDelta: 0,
    shouldAdvanceLevel: false,
    shouldLoseLife: true,
    shouldRetryLevel: false,
    shouldEndGame: true,
  });
  assert.equal(
    buildNoiseFilterFeedbackMessage(resolution, 5, 10, 1),
    "Yanlış seçim! Son can da gitti, oyun bitiyor.",
  );
  assert.equal(isNoiseFilterInteractionLocked(null, false), false);
});
