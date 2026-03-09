import assert from "node:assert/strict";
import test from "node:test";

import {
  calculatePuzzleMasterScore,
  clampSelectionCoordinate,
  createDefaultSelection,
  getRandomTargetBox,
  getSelectionFromPointer,
  isSelectionCorrect,
} from "../../../../src/components/BrainTrainer/puzzleMaster/logic.ts";

test("default selection keeps the legacy starting position", () => {
  assert.deepEqual(createDefaultSelection(), { x: 206, y: 206 });
});

test("selection coordinates clamp to the puzzle bounds", () => {
  assert.equal(clampSelectionCoordinate(-10), 0);
  assert.equal(clampSelectionCoordinate(999), 432);
});

test("pointer mapping converts board coordinates into puzzle selection", () => {
  const selection = getSelectionFromPointer({
    clientX: 150,
    clientY: 130,
    rectLeft: 10,
    rectTop: 20,
    rectWidth: 256,
    rectHeight: 256,
  });

  assert.deepEqual(selection, { x: 240, y: 180 });
});

test("target generation stays inside the padded crop area", () => {
  const target = getRandomTargetBox(() => 0.999);

  assert.deepEqual(target, {
    x: 411,
    y: 411,
    width: 80,
    height: 80,
  });
});

test("selection hit check uses the legacy generous tolerance", () => {
  assert.equal(
    isSelectionCorrect(
      { x: 100, y: 100 },
      { x: 120, y: 118, width: 80, height: 80 },
    ),
    true,
  );
  assert.equal(
    isSelectionCorrect(
      { x: 100, y: 100 },
      { x: 130, y: 130, width: 80, height: 80 },
    ),
    false,
  );
});

test("score formula preserves the original level multiplier", () => {
  assert.equal(calculatePuzzleMasterScore(7), 350);
});
