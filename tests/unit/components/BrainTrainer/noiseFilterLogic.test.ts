import assert from "node:assert/strict";
import test from "node:test";

import type { SoundItem } from "../../../../src/components/BrainTrainer/noiseFilterData.ts";
import {
  NUMBER_OF_OPTIONS,
} from "../../../../src/components/BrainTrainer/noiseFilter/constants.ts";
import {
  calculateNoiseFilterScore,
  createRound,
  isAnswerCorrect,
} from "../../../../src/components/BrainTrainer/noiseFilter/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("round generation keeps the target inside a unique ten-option grid", () => {
  const round = createRound(undefined, createSeededRandom(42));

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
  const round = createRound(soundPool, createSeededRandom(7));

  assert.ok(round);
  assert.equal(round.options.length, soundPool.length);
  assert.equal(new Set(round.options.map((sound) => sound.name)).size, soundPool.length);
});

test("score and answer helpers preserve the legacy rules", () => {
  const round = createRound(undefined, createSeededRandom(9));

  assert.ok(round);
  assert.equal(calculateNoiseFilterScore(1), 20);
  assert.equal(calculateNoiseFilterScore(6), 120);
  assert.equal(isAnswerCorrect(round.targetSound.name, round), true);
  assert.equal(isAnswerCorrect("Yanlis", round), false);
  assert.equal(isAnswerCorrect("Yanlis", null), false);
});
