import assert from "node:assert/strict";
import test from "node:test";

import {
  isPointInShape,
  rotatePoint,
} from "../../../../src/components/BrainTrainer/positionPuzzle/geometry.ts";
import { getResponsiveCanvasSize } from "../../../../src/components/BrainTrainer/positionPuzzle/layout.ts";
import {
  createPuzzleForLevel,
} from "../../../../src/components/BrainTrainer/positionPuzzle/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("rotatePoint rotates around the given center", () => {
  const rotated = rotatePoint({ x: 2, y: 0 }, { x: 0, y: 0 }, 90);

  assert.ok(Math.abs(rotated.x) < 0.000001);
  assert.ok(Math.abs(rotated.y - 2) < 0.000001);
});

test("isPointInShape handles circle, rotated rectangle and triangle regions", () => {
  assert.equal(
    isPointInShape(
      { x: 20, y: 20 },
      { id: "c", type: "circle", color: "#fff", rotation: 0, cx: 20, cy: 20, r: 10 },
    ),
    true,
  );

  assert.equal(
    isPointInShape(
      { x: 50, y: 50 },
      {
        id: "r",
        type: "rect",
        color: "#fff",
        rotation: 45,
        x: 40,
        y: 40,
        w: 20,
        h: 20,
      },
    ),
    true,
  );

  assert.equal(
    isPointInShape(
      { x: 25, y: 20 },
      {
        id: "t",
        type: "triangle",
        color: "#fff",
        rotation: 0,
        p1: { x: 20, y: 10 },
        p2: { x: 10, y: 30 },
        p3: { x: 30, y: 30 },
      },
    ),
    true,
  );
});

test("createPuzzleForLevel builds a deterministic puzzle with four options", () => {
  const puzzle = createPuzzleForLevel(6, createSeededRandom(12345));

  assert.ok(puzzle);
  assert.equal(puzzle?.shapes.length, 2);
  assert.equal(puzzle?.options.length, 4);
  assert.ok((puzzle?.correctOptionId ?? -1) >= 0);
  assert.ok((puzzle?.correctOptionId ?? -1) <= 3);
});

test("getResponsiveCanvasSize follows viewport sizing rule", () => {
  assert.equal(getResponsiveCanvasSize(360), 328);
  assert.equal(getResponsiveCanvasSize(900), 480);
});
