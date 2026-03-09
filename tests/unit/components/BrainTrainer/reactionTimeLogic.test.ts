import assert from "node:assert/strict";
import test from "node:test";
import {
  addReactionTime,
  calculateReactionScore,
  createEmptyReactionMetrics,
  getBackNavigation,
  getReactionButtonClass,
  shouldWaitForTarget,
} from "../../../../src/components/BrainTrainer/reactionTime/logic.ts";

test("addReactionTime updates average and best reaction metrics", () => {
  const first = addReactionTime(createEmptyReactionMetrics(), 320);
  const second = addReactionTime(first, 280);

  assert.deepEqual(first, {
    reactionTimes: [320],
    averageReaction: 320,
    bestReaction: 320,
  });

  assert.deepEqual(second, {
    reactionTimes: [320, 280],
    averageReaction: 300,
    bestReaction: 280,
  });
});

test("calculateReactionScore rewards lower reaction times and streaks", () => {
  const lowScore = calculateReactionScore(480, 1);
  const highScore = calculateReactionScore(180, 3);

  assert.equal(lowScore, 70);
  assert.equal(highScore, 240);
});

test("getReactionButtonClass returns result styling by round outcome", () => {
  assert.equal(
    getReactionButtonClass({
      roundState: "waiting",
      currentColor: "green",
      gameMode: "simple",
      currentReactionTime: null,
    }),
    "bg-slate-200 dark:bg-slate-700",
  );

  assert.equal(
    getReactionButtonClass({
      roundState: "result",
      currentColor: "red",
      gameMode: "selective",
      currentReactionTime: 245,
    }),
    "bg-cyber-pink",
  );

  assert.equal(
    getReactionButtonClass({
      roundState: "result",
      currentColor: "red",
      gameMode: "selective",
      currentReactionTime: null,
    }),
    "bg-cyber-green",
  );
});

test("shouldWaitForTarget and getBackNavigation normalize gameplay helpers", () => {
  assert.equal(shouldWaitForTarget("selective", "red"), true);
  assert.equal(shouldWaitForTarget("simple", "red"), false);

  assert.deepEqual(getBackNavigation(true, false), {
    backLink: "/atolyeler/sinav-simulasyonu/devam",
    backLabel: "Sınavı Bitir",
  });

  assert.deepEqual(getBackNavigation(false, true), {
    backLink: "/bilsem-zeka",
    backLabel: "Arcade",
  });
});
