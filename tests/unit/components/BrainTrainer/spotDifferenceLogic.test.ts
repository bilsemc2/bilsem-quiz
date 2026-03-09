import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateSpotDifferenceScore,
  createRound,
  createTiles,
  getLevelConfig,
} from "../../../../src/components/BrainTrainer/spotDifference/logic.ts";

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

test("getLevelConfig scales grid, time and unlocked diff types by level", () => {
  assert.deepEqual(getLevelConfig(1).types, ["lightness", "hue", "radius"]);
  assert.deepEqual(getLevelConfig(12).types, [
    "lightness",
    "hue",
    "radius",
    "scale",
    "rotation",
    "shape",
  ]);
  assert.equal(getLevelConfig(1).perRoundTime, 15);
  assert.equal(getLevelConfig(20).perRoundTime, 9);
});

test("createRound builds a valid odd tile definition for the chosen diff type", () => {
  const round = createRound(11, createSeededRandom(12345));

  assert.ok(round.size >= 3 && round.size <= 6);
  assert.equal(round.total, round.size * round.size);
  assert.ok(round.oddIndex >= 0 && round.oddIndex < round.total);

  if (round.diffType === "shape") {
    assert.notEqual(round.oddShape.id, round.baseShape.id);
  } else if (round.diffType === "lightness") {
    assert.notEqual(round.odd.light, round.base.light);
  } else if (round.diffType === "hue") {
    assert.notEqual(round.odd.hue, round.base.hue);
  } else if (round.diffType === "radius") {
    assert.notEqual(round.odd.radius, round.base.radius);
  } else if (round.diffType === "scale") {
    assert.notEqual(round.odd.scale, round.base.scale);
  } else if (round.diffType === "rotation") {
    assert.notEqual(round.odd.rotate, round.base.rotate);
  }
});

test("createTiles applies odd styling only to the odd tile index", () => {
  const round = createRound(8, createSeededRandom(99));
  const tiles = createTiles(round, createSeededRandom(99));
  const oddTile = tiles[round.oddIndex];
  const baseTile = tiles.find((tile) => tile.index !== round.oddIndex);

  assert.equal(tiles.length, round.total);
  assert.equal(oddTile.shape.id, round.oddShape.id);
  assert.equal(oddTile.style.scale, round.odd.scale);
  assert.equal(baseTile?.shape.id, round.baseShape.id);
  assert.equal(baseTile?.style.scale, round.base.scale);
});

test("calculateSpotDifferenceScore rewards remaining round time", () => {
  assert.equal(calculateSpotDifferenceScore(4, 6.2), 71);
});
