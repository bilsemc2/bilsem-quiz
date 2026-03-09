import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSvgPath,
  calculateLazerHafizaScore,
  generateRandomPath,
  getLevelConfig,
  getPreviewSpeed,
} from "../../../../src/components/BrainTrainer/lazerHafiza/logic.ts";

test("level config scales grid, path length and diagonal unlocks by level", () => {
  assert.deepEqual(getLevelConfig(1), {
    gridSize: 3,
    pathLength: 3,
    allowDiagonals: false,
  });
  assert.deepEqual(getLevelConfig(3), {
    gridSize: 4,
    pathLength: 4,
    allowDiagonals: true,
  });
  assert.deepEqual(getLevelConfig(20), {
    gridSize: 6,
    pathLength: 18,
    allowDiagonals: true,
  });
});

test("preview speed keeps the legacy clamp", () => {
  assert.equal(getPreviewSpeed(1), 680);
  assert.equal(getPreviewSpeed(10), 500);
  assert.equal(getPreviewSpeed(30), 350);
});

test("generateRandomPath stays in bounds, avoids revisits and respects moves", () => {
  const path = generateRandomPath(4, 6, false, () => 0);

  assert.equal(path.length, 6);
  assert.equal(new Set(path.map(({ row, col }) => `${row},${col}`)).size, 6);

  path.forEach(({ row, col }) => {
    assert.ok(row >= 0 && row < 4);
    assert.ok(col >= 0 && col < 4);
  });

  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    const rowDelta = Math.abs(current.row - previous.row);
    const colDelta = Math.abs(current.col - previous.col);

    assert.equal(rowDelta + colDelta, 1);
  }
});

test("buildSvgPath converts grid coordinates into centered svg segments", () => {
  const svgPath = buildSvgPath(
    [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
    ],
    2,
  );

  assert.equal(svgPath, "M 25 25 L 75 25 L 75 75");
});

test("score formula preserves the legacy calculation", () => {
  assert.equal(calculateLazerHafizaScore(5, 7), 570);
});
