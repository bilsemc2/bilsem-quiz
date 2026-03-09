import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmptyPainting,
  createLevel,
  generatePattern,
  getAvailableColors,
  getGridSizeForLevel,
  getPatternPainterScore,
  getPatternTypeForLevel,
  isPaintingComplete,
  isPaintingCorrect,
  paintTile,
} from "../../../../src/components/BrainTrainer/patternPainter/logic.ts";

test("grid size and pattern type scale by level band", () => {
  assert.equal(getGridSizeForLevel(1), 6);
  assert.equal(getGridSizeForLevel(8), 7);
  assert.equal(getGridSizeForLevel(14), 8);
  assert.equal(getGridSizeForLevel(19), 9);
  assert.equal(getPatternTypeForLevel(1), "checkered");
  assert.equal(getPatternTypeForLevel(5), "random-repeating");
  assert.equal(getPatternTypeForLevel(6), "checkered");
});

test("generatePattern keeps checkered and stripe rules", () => {
  const checkered = generatePattern(4, "checkered", () => 0);
  assert.equal(checkered[0][0], checkered[1][1]);
  assert.notEqual(checkered[0][0], checkered[0][1]);

  const stripes = generatePattern(4, "stripes", () => 0);
  assert.equal(stripes[0][0], stripes[0][3]);
  assert.equal(stripes[1][0], stripes[1][2]);
  assert.notEqual(stripes[0][0], stripes[1][0]);
});

test("createLevel keeps gap inside the board and slices the correct answer", () => {
  const level = createLevel(7, () => 0);
  const { row, column } = level.gapPos;

  assert.equal(level.size, 7);
  assert.ok(row > 0);
  assert.ok(column > 0);
  assert.deepEqual(level.correctOption, [
    [level.grid[row][column], level.grid[row][column + 1]],
    [level.grid[row + 1][column], level.grid[row + 1][column + 1]],
  ]);
});

test("painting helpers update state and validate completion", () => {
  const empty = createEmptyPainting();
  assert.equal(isPaintingComplete(empty), false);

  const oncePainted = paintTile(empty, 0, 1, "#123456");
  assert.equal(oncePainted[0][1], "#123456");
  assert.equal(empty[0][1], null);

  const completed = [
    ["#1", "#2"],
    ["#3", "#4"],
  ];
  assert.equal(isPaintingComplete(completed), true);
  assert.equal(isPaintingCorrect(completed, completed), true);
  assert.equal(isPaintingCorrect(completed, [["#1", "#2"]]), false);
});

test("available colors are deduplicated and score matches legacy formula", () => {
  assert.deepEqual(
    getAvailableColors([
      ["#1", "#2"],
      ["#2", "#3"],
    ]),
    ["#1", "#2", "#3"],
  );
  assert.equal(getPatternPainterScore(9), 90);
});
