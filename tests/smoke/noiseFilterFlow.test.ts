import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createRound,
  getOptionCountForLevel,
  isNoiseFilterInteractionLocked,
  resolveNoiseFilterSelection,
} from "../../src/components/BrainTrainer/noiseFilter/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
};

test("noise filter smoke covers route registration and a full answer scenario", () => {
  const routeSource = readFileSync(
    new URL("../../src/routes/gameRoutes.tsx", import.meta.url),
    "utf8",
  );
  const assessmentSource = readFileSync(
    new URL("../../src/pages/workshops/IndividualAssessmentPage.tsx", import.meta.url),
    "utf8",
  );
  const boardSource = readFileSync(
    new URL("../../src/components/BrainTrainer/noiseFilter/NoiseFilterBoard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(routeSource, /path="\/games\/gurultu-filtresi"/);
  assert.match(assessmentSource, /link:\s*"\/games\/gurultu-filtresi"/);
  assert.match(boardSource, /Sesi Tekrar Dinle/);
  assert.match(boardSource, /animate=\{animationTarget\}/);
  assert.match(boardSource, /whileHover=\{!isLocked \? \{ y: -4, scale: 1\.02 \} : undefined\}/);
  assert.match(boardSource, /scale:\s*\[1,\s*1\.08,\s*1\]/);
  assert.match(boardSource, /x:\s*\[0,\s*-12,\s*10,\s*-8,\s*6,\s*0\]/);

  const earlyRound = createRound(1, undefined, createSeededRandom(31));
  const lateRound = createRound(10, undefined, createSeededRandom(31));

  assert.ok(earlyRound);
  assert.ok(lateRound);
  assert.equal(earlyRound.options.length, getOptionCountForLevel(1));
  assert.equal(lateRound.options.length, getOptionCountForLevel(10));
  assert.equal(earlyRound.options.length < lateRound.options.length, true);

  const correctResolution = resolveNoiseFilterSelection({
    selectedName: earlyRound.targetSound.name,
    round: earlyRound,
    level: 1,
    lives: 5,
  });

  assert.equal(correctResolution.shouldAdvanceLevel, true);
  assert.equal(correctResolution.shouldLoseLife, false);
  assert.equal(isNoiseFilterInteractionLocked(earlyRound.targetSound.name, false), true);

  const wrongOption = lateRound.options.find(
    (sound) => sound.name !== lateRound.targetSound.name,
  );
  assert.ok(wrongOption);

  const wrongResolution = resolveNoiseFilterSelection({
    selectedName: wrongOption.name,
    round: lateRound,
    level: 10,
    lives: 1,
  });

  assert.equal(wrongResolution.shouldAdvanceLevel, false);
  assert.equal(wrongResolution.shouldLoseLife, true);
  assert.equal(wrongResolution.shouldEndGame, true);
  assert.equal(isNoiseFilterInteractionLocked(null, true), true);
});
