import {
  MATRIX_SIZE,
  MAX_LEVEL,
  OPTION_ROTATIONS,
  ROTATION_STEPS,
  SHAPE_COLORS,
} from "./constants.ts";
import type {
  RotationMatrixOption,
  RotationMatrixRound,
  RotationMatrixShape,
  RotationMatrixStick,
} from "./types.ts";

const randomId = (prefix: string, randomFn: () => number) => {
  return `${prefix}-${Math.floor(randomFn() * 1_000_000_000).toString(36)}`;
};

const pickRandomItem = <T>(items: readonly T[], randomFn: () => number) => {
  return items[Math.floor(randomFn() * items.length)];
};

const shuffleArray = <T>(items: T[], randomFn: () => number) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const cloneSticks = (sticks: RotationMatrixStick[]) => {
  return sticks.map((stick) => ({ ...stick }));
};

export const createBaseShape = (
  randomFn: () => number = Math.random,
): RotationMatrixShape => {
  const stickCount = 3 + Math.floor(randomFn() * 4);
  const sticks: RotationMatrixStick[] = [];
  const originX = (randomFn() - 0.5) * 10;
  const originY = (randomFn() - 0.5) * 10;

  for (let index = 0; index < stickCount; index += 1) {
    const isVertical = randomFn() > 0.5;
    sticks.push({
      color: pickRandomItem(SHAPE_COLORS, randomFn),
      isVertical,
      x: originX + (isVertical ? (randomFn() - 0.5) * 44 : (randomFn() - 0.5) * 12),
      y: originY + (isVertical ? (randomFn() - 0.5) * 12 : (randomFn() - 0.5) * 44),
      length: 45 + randomFn() * 45,
    });
  }

  sticks.push({
    color: pickRandomItem(SHAPE_COLORS, randomFn),
    isVertical: randomFn() > 0.5,
    x: 22 + randomFn() * 8,
    y: -22 - randomFn() * 8,
    length: 35,
  });

  return {
    id: randomId("base", randomFn),
    type: "sticks",
    rotation: 0,
    sticks,
  };
};

export const buildSequence = (
  baseShape: RotationMatrixShape,
  rotationStep: number,
  randomFn: () => number = Math.random,
) => {
  return Array.from({ length: MATRIX_SIZE }, (_, index) => ({
    ...baseShape,
    id: randomId(`step-${index}`, randomFn),
    rotation: (index * rotationStep) % 360,
    sticks: cloneSticks(baseShape.sticks),
  }));
};

export const buildOptions = (
  baseShape: RotationMatrixShape,
  correctShape: RotationMatrixShape,
  randomFn: () => number = Math.random,
): RotationMatrixOption[] => {
  const usedRotations = new Set([Math.round(correctShape.rotation % 360)]);
  const options: RotationMatrixOption[] = [{ shape: correctShape, isCorrect: true }];

  while (options.length < 4) {
    const rotation = pickRandomItem(OPTION_ROTATIONS, randomFn);

    if (usedRotations.has(rotation)) {
      continue;
    }

    usedRotations.add(rotation);
    options.push({
      isCorrect: false,
      shape: {
        ...baseShape,
        id: randomId(`wrong-${options.length}`, randomFn),
        rotation,
        sticks: cloneSticks(baseShape.sticks),
      },
    });
  }

  return shuffleArray(options, randomFn);
};

export const createRound = (
  randomFn: () => number = Math.random,
): RotationMatrixRound => {
  const rotationStep = pickRandomItem(ROTATION_STEPS, randomFn);
  const baseShape = createBaseShape(randomFn);
  const sequence = buildSequence(baseShape, rotationStep, randomFn);
  const targetIndex = Math.floor(randomFn() * MATRIX_SIZE);
  const correctShape = sequence[targetIndex];

  return {
    sequence,
    targetIndex,
    options: buildOptions(baseShape, correctShape, randomFn),
  };
};

export const calculateRotationMatrixScore = (level: number) => {
  return 10 * level;
};

export const isMaxLevel = (level: number) => {
  return level >= MAX_LEVEL;
};
