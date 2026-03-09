import { MAX_N_VALUE, SHAPE_DEFINITIONS } from "./constants.ts";
import type { ShapeData } from "./types.ts";

type RandomFn = () => number;
type IdFactory = () => string;

const pickRandomIndex = (length: number, random: RandomFn) => {
  return Math.floor(random() * length);
};

const createShapeId = () => Math.random().toString(36).slice(2, 11);

export const getNValueForLevel = (level: number) => {
  return Math.min(Math.floor((Math.max(level, 1) - 1) / 4) + 1, MAX_N_VALUE);
};

export const getRequiredTrialsForLevel = (level: number) => {
  return 10 + level * 2;
};

export const getNBackScore = (level: number, nValue: number) => {
  return 50 * level * nValue;
};

export const areShapesEqual = (left: ShapeData, right: ShapeData) => {
  return left.key === right.key && left.color === right.color;
};

export const isCorrectDecision = (
  currentShape: ShapeData,
  history: ShapeData[],
  nValue: number,
  isSame: boolean,
) => {
  if (history.length < nValue) {
    return false;
  }

  const targetShape = history[history.length - nValue];
  const matchesTarget = areShapesEqual(currentShape, targetShape);

  return isSame ? matchesTarget : !matchesTarget;
};

export const generateShape = (
  history: ShapeData[],
  nValue: number,
  random: RandomFn = Math.random,
  idFactory: IdFactory = createShapeId,
): ShapeData => {
  const hasTargetHistory = history.length >= nValue;
  const shouldReuseTarget = hasTargetHistory && random() > 0.5;

  if (shouldReuseTarget) {
    const targetShape = history[history.length - nValue];

    return {
      id: idFactory(),
      key: targetShape.key,
      color: targetShape.color,
    };
  }

  let definition =
    SHAPE_DEFINITIONS[pickRandomIndex(SHAPE_DEFINITIONS.length, random)];

  if (hasTargetHistory) {
    const targetShape = history[history.length - nValue];
    let attempts = 0;

    while (
      definition.key === targetShape.key &&
      definition.color === targetShape.color &&
      attempts < 10
    ) {
      definition =
        SHAPE_DEFINITIONS[pickRandomIndex(SHAPE_DEFINITIONS.length, random)];
      attempts += 1;
    }
  }

  return {
    id: idFactory(),
    key: definition.key,
    color: definition.color,
  };
};
