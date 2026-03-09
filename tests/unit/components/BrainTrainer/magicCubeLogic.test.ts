import assert from "node:assert/strict";
import test from "node:test";

import {
  createFacePoseMap,
  createMagicCubeLevel,
  findFacePlacement,
  getMagicCubeScore,
} from "../../../../src/components/BrainTrainer/magicCube/logic.ts";
import { NET_LAYOUTS } from "../../../../src/components/BrainTrainer/magicCube/constants.ts";

const createDeterministicRandom = (...values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

test("magic cube score keeps the legacy level multiplier", () => {
  assert.equal(getMagicCubeScore(6), 120);
});

test("level generation returns six faces and one correct option", () => {
  const levelData = createMagicCubeLevel(createDeterministicRandom(0.2, 0.1, 0.9, 0.3, 0.7, 0.4, 0.8, 0.6, 0.5));

  assert.equal(Object.keys(levelData.facesData).length, 6);
  assert.equal(levelData.options.length, 3);
  assert.equal(levelData.options.filter((option) => option.isCorrect).length, 1);
  assert.ok(levelData.net.grid.flat().includes("FRONT"));
});

test("face placement is calculated relative to the front face", () => {
  const placement = findFacePlacement(NET_LAYOUTS[0].grid, "LEFT");

  assert.deepEqual(placement, {
    row: 1,
    col: 0,
    relativeRow: 0,
    relativeCol: -1,
  });
});

test("face pose map uses half-size offsets for cube folding", () => {
  assert.deepEqual(createFacePoseMap(80).TOP, {
    rx: 90,
    ry: 0,
    rz: 0,
    tx: 0,
    ty: -40,
    tz: 0,
  });
});
