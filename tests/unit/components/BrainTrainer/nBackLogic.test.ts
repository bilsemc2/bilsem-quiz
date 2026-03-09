import assert from "node:assert/strict";
import test from "node:test";

import {
  areShapesEqual,
  generateShape,
  getNBackScore,
  getNValueForLevel,
  getRequiredTrialsForLevel,
  isCorrectDecision,
} from "../../../../src/components/BrainTrainer/nBack/logic.ts";
import type { ShapeData } from "../../../../src/components/BrainTrainer/nBack/types.ts";

const createShape = (
  id: string,
  key: ShapeData["key"],
  color: string,
): ShapeData => ({
  id,
  key,
  color,
});

test("n value bands follow the original four-level progression", () => {
  assert.equal(getNValueForLevel(1), 1);
  assert.equal(getNValueForLevel(4), 1);
  assert.equal(getNValueForLevel(5), 2);
  assert.equal(getNValueForLevel(9), 3);
  assert.equal(getNValueForLevel(13), 4);
  assert.equal(getNValueForLevel(20), 4);
});

test("trial threshold and score preserve the legacy formula", () => {
  assert.equal(getRequiredTrialsForLevel(1), 12);
  assert.equal(getRequiredTrialsForLevel(7), 24);
  assert.equal(getNBackScore(6, 3), 900);
});

test("shape equality compares key and color together", () => {
  assert.equal(
    areShapesEqual(
      createShape("a", "square", "#111111"),
      createShape("b", "square", "#111111"),
    ),
    true,
  );
  assert.equal(
    areShapesEqual(
      createShape("a", "square", "#111111"),
      createShape("b", "circle", "#111111"),
    ),
    false,
  );
});

test("generateShape can intentionally repeat the n-back target", () => {
  const history = [
    createShape("h1", "square", "#FFE81A"),
    createShape("h2", "circle", "#00FF9D"),
  ];
  const generated = generateShape(history, 2, () => 0.9, () => "next-id");

  assert.equal(generated.id, "next-id");
  assert.equal(generated.key, "square");
  assert.equal(generated.color, "#FFE81A");
});

test("generateShape avoids the target shape when creating a distractor", () => {
  const history = [
    createShape("h1", "square", "#FFE81A"),
    createShape("h2", "circle", "#00FF9D"),
  ];
  const randomValues = [0.1, 0, 0.4];
  const generated = generateShape(
    history,
    2,
    () => randomValues.shift() ?? 0.8,
    () => "dist-id",
  );

  assert.equal(generated.id, "dist-id");
  assert.notEqual(generated.key, "square");
  assert.notEqual(generated.color, "#FFE81A");
});

test("decision evaluation checks the n-back target correctly", () => {
  const history = [
    createShape("h1", "square", "#FFE81A"),
    createShape("h2", "circle", "#00FF9D"),
    createShape("h3", "triangle", "#FF1493"),
  ];
  const currentMatch = createShape("c1", "circle", "#00FF9D");
  const currentMismatch = createShape("c2", "hexagon", "#FF5722");

  assert.equal(isCorrectDecision(currentMatch, history, 2, true), true);
  assert.equal(isCorrectDecision(currentMatch, history, 2, false), false);
  assert.equal(isCorrectDecision(currentMismatch, history, 2, false), true);
});
