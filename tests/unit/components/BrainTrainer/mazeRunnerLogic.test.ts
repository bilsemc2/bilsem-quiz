import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCanvasSize,
  createMazeLevel,
  generateMaze,
  getLevelDimensions,
  getLogicalCellKey,
  isExitReached,
  isStartZone,
  shouldAppendPoint,
  solveMaze,
} from "../../../../src/components/BrainTrainer/mazeRunner/logic.ts";

test("getLevelDimensions scales maze size by level", () => {
  assert.deepEqual(getLevelDimensions(1), { cols: 5, rows: 5 });
  assert.deepEqual(getLevelDimensions(10), { cols: 17, rows: 15 });
});

test("generateMaze creates a traversable maze and solveMaze finds start/end path", () => {
  const maze = generateMaze(4, 4, () => 0);
  const solution = solveMaze(maze);

  assert.equal(maze.length, 4);
  assert.equal(maze[0].length, 4);
  assert.ok(solution.has("0,0"));
  assert.ok(solution.has("3,3"));
});

test("createMazeLevel packages maze, solution and wall seeds", () => {
  const levelData = createMazeLevel(3, () => 0.25);

  assert.equal(levelData.cols, 8);
  assert.equal(levelData.rows, 7);
  assert.equal(levelData.wallSeeds.length, levelData.cols * levelData.rows);
  assert.ok(levelData.solutionSet.size > 0);
});

test("canvas and path helpers normalize pointer calculations", () => {
  assert.equal(calculateCanvasSize(360, 640), 328);
  assert.equal(isStartZone(20, 30, 40), true);
  assert.equal(getLogicalCellKey(81, 79, 40), "2,1");
  assert.equal(isExitReached(185, 185, 5, 5, 40), true);
  assert.equal(shouldAppendPoint([{ x: 0, y: 0 }], 1, 1), false);
  assert.equal(shouldAppendPoint([{ x: 0, y: 0 }], 10, 0), true);
});
