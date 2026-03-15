import assert from "node:assert/strict";
import test from "node:test";

import {
  canPlayNoiseFilterAudio,
  getNoiseFilterBackgroundVolume,
  getNoiseFilterTargetVolume,
} from "../../../../src/components/BrainTrainer/noiseFilter/audioModel.ts";

test("target volume follows the global sound preferences", () => {
  assert.equal(getNoiseFilterTargetVolume(100, false), 1);
  assert.equal(getNoiseFilterTargetVolume(35, false), 0.35);
  assert.equal(getNoiseFilterTargetVolume(35, true), 0);
});

test("background volume multiplies local noise level with the shared app volume", () => {
  assert.equal(getNoiseFilterBackgroundVolume(0.4, 100, false), 0.4);
  assert.equal(getNoiseFilterBackgroundVolume(0.4, 50, false), 0.2);
  assert.equal(getNoiseFilterBackgroundVolume(1.4, 50, false), 0.5);
  assert.equal(getNoiseFilterBackgroundVolume(0.4, 50, true), 0);
});

test("playback gating respects mute and zero-volume states", () => {
  assert.equal(canPlayNoiseFilterAudio(100, false), true);
  assert.equal(canPlayNoiseFilterAudio(0, false), false);
  assert.equal(canPlayNoiseFilterAudio(80, true), false);
});
