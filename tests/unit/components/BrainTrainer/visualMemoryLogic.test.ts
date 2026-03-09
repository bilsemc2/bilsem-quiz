import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateVisualMemoryScore,
  createModifiedGrid,
  createRound,
  generateGrid,
  getLevelConfig,
} from "../../../../src/components/BrainTrainer/visualMemory/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("getLevelConfig falls back to max-level config", () => {
  assert.deepEqual(getLevelConfig(1), { gridSize: 3, items: 3, memorizeMs: 3000 });
  assert.deepEqual(getLevelConfig(99), { gridSize: 5, items: 15, memorizeMs: 1500 });
});

test("generateGrid creates the requested number of active cells", () => {
  const grid = generateGrid(4, 7, createSeededRandom(42));

  assert.equal(grid.length, 16);
  assert.equal(grid.filter((cell) => cell.icon !== null).length, 7);
});

test("createModifiedGrid changes exactly one active cell", () => {
  const originalGrid = generateGrid(3, 4, createSeededRandom(77));
  const { grid: updatedGrid, targetCellId } = createModifiedGrid(
    originalGrid,
    createSeededRandom(99),
  );
  const changedCells = updatedGrid.filter((cell, index) => {
    const originalCell = originalGrid[index];
    return cell.icon !== originalCell.icon || cell.color !== originalCell.color;
  });

  assert.equal(updatedGrid.length, originalGrid.length);
  assert.equal(changedCells.length, 1);
  assert.equal(changedCells[0].id, targetCellId);
});

test("createRound packages both boards and target cell metadata", () => {
  const round = createRound(12, createSeededRandom(123));

  assert.equal(round.gridSize, 4);
  assert.equal(round.gridBefore.length, 16);
  assert.equal(round.gridAfter.length, 16);
  assert.ok(round.gridAfter.some((cell) => cell.id === round.targetCellId));
});

test("calculateVisualMemoryScore scales with level", () => {
  assert.equal(calculateVisualMemoryScore(6), 90);
});
