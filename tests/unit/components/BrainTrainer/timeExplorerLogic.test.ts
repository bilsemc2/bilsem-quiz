import assert from "node:assert/strict";
import test from "node:test";

import {
  addMinutesToClockTime,
  degreesToMinutes,
  formatClockTime,
  getMinuteGranularity,
  getNextDisplayHour,
  getRandomTime,
  getTargetOffset,
  getTimeExplorerScore,
  isCorrectClockAnswer,
  minutesToDegrees,
  normalizeClockHour,
} from "../../../../src/components/BrainTrainer/timeExplorer/logic.ts";

test("minute granularity unlocks one-minute precision after level ten", () => {
  assert.equal(getMinuteGranularity(3), 5);
  assert.equal(getMinuteGranularity(10), 5);
  assert.equal(getMinuteGranularity(11), 1);
});

test("getRandomTime respects level granularity", () => {
  const early = getRandomTime(4, () => 0.52);
  const late = getRandomTime(15, () => 0.52);

  assert.equal(early.hours, 7);
  assert.equal(early.minutes % 5, 0);
  assert.equal(late.minutes, 31);
});

test("target offsets follow level bands including backward rounds", () => {
  assert.equal(getTargetOffset(2), 5);
  assert.equal(getTargetOffset(8), 30);
  assert.equal(getTargetOffset(16), 60);
  assert.equal(getTargetOffset(19, () => 0.9), -10);
  assert.equal(getTargetOffset(20, () => 0.1), -20);
});

test("clock arithmetic wraps around twelve-hour boundaries", () => {
  assert.deepEqual(addMinutesToClockTime({ hours: 12, minutes: 50 }, 20), {
    hours: 1,
    minutes: 10,
  });
  assert.deepEqual(addMinutesToClockTime({ hours: 1, minutes: 10 }, -20), {
    hours: 12,
    minutes: 50,
  });
});

test("drag helpers convert angles and wrap hours correctly", () => {
  assert.equal(minutesToDegrees(15), 90);
  assert.equal(degreesToMinutes(360), 0);
  assert.equal(getNextDisplayHour(12, 55, 5), 1);
  assert.equal(getNextDisplayHour(1, 5, 55), 12);
});

test("answer validation includes both hour and minute", () => {
  const targetTime = { hours: 12, minutes: 50 };

  assert.equal(isCorrectClockAnswer(targetTime, 12, 50), true);
  assert.equal(isCorrectClockAnswer(targetTime, 1, 50), false);
  assert.equal(isCorrectClockAnswer(targetTime, 12, 45), false);
});

test("formatting and score preserve the intended display", () => {
  assert.equal(normalizeClockHour(0), 12);
  assert.equal(formatClockTime({ hours: 13, minutes: 5 }), "1:05");
  assert.equal(getTimeExplorerScore(7), 70);
});
