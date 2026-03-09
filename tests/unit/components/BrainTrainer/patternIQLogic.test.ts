import assert from "node:assert/strict";
import test from "node:test";
import {
  areWagonStatesEqual,
  calculateWagonState,
  generateOptions,
} from "../../../../src/components/BrainTrainer/patternIQ/logic.ts";
import {
  ShapeType,
  TransformationType,
  type PatternData,
} from "../../../../src/components/BrainTrainer/patternIQ/types.ts";

const samplePattern: PatternData = {
  id: "pattern-1",
  difficulty: "Orta",
  description: "test-pattern",
  layers: [
    {
      id: "rotation-layer",
      shape: ShapeType.ARROW,
      color: "#000000",
      transformation: TransformationType.ROTATION,
      startValue: 0,
      stepChange: 90,
      size: 34,
    },
    {
      id: "clock-layer",
      shape: ShapeType.CIRCLE,
      color: "#ff0000",
      transformation: TransformationType.CLOCK_MOVE,
      startValue: 11,
      stepChange: 2,
      size: 24,
    },
  ],
};

test("calculateWagonState advances rotation and clock positions with wrapping", () => {
  const state = calculateWagonState(samplePattern, 2);

  assert.deepEqual(state.layerStates, [
    {
      layerId: "rotation-layer",
      rotation: 180,
      position: 0,
      visible: true,
    },
    {
      layerId: "clock-layer",
      rotation: 0,
      position: 3,
      visible: true,
    },
  ]);
});

test("areWagonStatesEqual normalizes rotation while comparing layer states", () => {
  const first = calculateWagonState(samplePattern, 4);
  const second = {
    ...first,
    layerStates: first.layerStates.map((layerState) =>
      layerState.layerId === "rotation-layer"
        ? { ...layerState, rotation: layerState.rotation + 360 }
        : layerState,
    ),
  };

  assert.equal(areWagonStatesEqual(first, second), true);
});

test("generateOptions includes the correct wagon state exactly once", () => {
  const correctState = calculateWagonState(samplePattern, 4);
  const options = generateOptions(samplePattern, 4);
  const matches = options.filter((option) =>
    areWagonStatesEqual(option, correctState),
  );

  assert.equal(options.length, 4);
  assert.equal(matches.length, 1);
});
