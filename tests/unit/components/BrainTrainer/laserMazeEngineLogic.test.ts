import assert from "node:assert/strict";
import test from "node:test";

import { CELL_SIZE } from "../../../../src/components/BrainTrainer/laserMazeEngine.ts";

// Note: The laserMazeEngine module exports only CELL_SIZE (a constant) and
// createLaserMazeEngine (which requires a real DOM container, THREE.js WebGL
// renderer, and requestAnimationFrame — not testable as a pure function).
// All internal helpers (generateMazeCells, boundaryCells, bfs, buildPath,
// getMoveDir, densifyPath, createMazeConfig) are private.
//
// We test the exported constant and validate expected invariants.

test("CELL_SIZE is a positive number used for grid spacing", () => {
  assert.equal(typeof CELL_SIZE, "number");
  assert.ok(CELL_SIZE > 0);
  assert.equal(CELL_SIZE, 2.2);
});
