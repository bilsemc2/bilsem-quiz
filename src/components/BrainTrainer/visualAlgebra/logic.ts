import { ShapeType } from "./types.ts";
import type { LevelData, PanContent, WeightMap } from "./types.ts";

type RandomFn = () => number;

export const AVAILABLE_SHAPES = [
  ShapeType.SQUARE,
  ShapeType.TRIANGLE,
  ShapeType.CIRCLE,
  ShapeType.STAR,
];

const shuffleItems = <T>(items: readonly T[], random: RandomFn) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const getShapesForLevel = (level: number) =>
  level <= 3
    ? AVAILABLE_SHAPES.slice(0, 2)
    : level <= 7
      ? AVAILABLE_SHAPES.slice(0, 3)
      : AVAILABLE_SHAPES;

export const calculatePanWeight = (content: PanContent, weights: WeightMap) =>
  Object.entries(content).reduce(
    (total, [shape, count]) =>
      total + (weights[shape as ShapeType] ?? 0) * (count as number),
    0,
  );

export const calculateVisualAlgebraScore = (level: number) => 10 * level;

const generateWeights = (
  shapes: readonly ShapeType[],
  level: number,
  random: RandomFn,
) => {
  const weights: WeightMap = {};
  const maxWeight = Math.min(3 + Math.floor(level / 3), 10);

  shapes.forEach((shape) => {
    weights[shape] = Math.floor(random() * maxWeight) + 1;
  });

  const values = Object.values(weights) as number[];

  if (values.every((value) => value === values[0]) && shapes.length > 1) {
    weights[shapes[1]] = ((weights[shapes[0]] ?? 1) % maxWeight) + 1;
  }

  return weights;
};

const findBalancedRightPan = (
  shapes: readonly ShapeType[],
  weights: WeightMap,
  target: number,
  maxCountPerShape: number,
  leftPan: PanContent,
  random: RandomFn,
) => {
  const solutions: PanContent[] = [];

  const search = (index: number, current: PanContent, sum: number) => {
    if (sum > target) {
      return;
    }

    if (index === shapes.length) {
      if (sum !== target) {
        return;
      }

      const totalItems = Object.values(current).reduce(
        (accumulator, value) => accumulator + (value ?? 0),
        0,
      );

      if (totalItems > 0) {
        solutions.push({ ...current });
      }

      return;
    }

    const shape = shapes[index];
    const value = weights[shape] ?? 0;
    const maxByTarget = value > 0 ? Math.floor((target - sum) / value) : 0;
    const countOptions = shuffleItems(
      Array.from({ length: Math.min(maxCountPerShape, maxByTarget) + 1 }, (_, item) => item),
      random,
    );

    for (const count of countOptions) {
      if (count > 0) {
        current[shape] = count;
      } else {
        delete current[shape];
      }

      search(index + 1, current, sum + count * value);
    }

    delete current[shape];
  };

  search(0, {}, 0);

  if (solutions.length === 0) {
    return null;
  }

  const nonIdenticalSolutions = solutions.filter((solution) =>
    shapes.some((shape) => (solution[shape] ?? 0) !== (leftPan[shape] ?? 0)),
  );
  const pool = nonIdenticalSolutions.length > 0 ? nonIdenticalSolutions : solutions;

  return pool[Math.floor(random() * pool.length)] ?? null;
};

export const generateLevel = (level: number, random: RandomFn = Math.random): LevelData => {
  const shapes = getShapesForLevel(level);
  const referenceShapeCount = Math.min(1 + Math.floor(level / 4), 3);
  const questionShapeCount = Math.min(1 + Math.floor(level / 3), 4);

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const weights = generateWeights(shapes, level, random);
    const referenceLeft: PanContent = {};

    for (let index = 0; index < referenceShapeCount; index += 1) {
      const shape = shapes[index % shapes.length];
      referenceLeft[shape] = (referenceLeft[shape] ?? 0) + 1;
    }

    const targetWeight = calculatePanWeight(referenceLeft, weights);
    const referenceRight = findBalancedRightPan(
      shapes,
      weights,
      targetWeight,
      Math.ceil(level / 5) + 2,
      referenceLeft,
      random,
    );

    if (!referenceRight) {
      continue;
    }

    const questionLeft: PanContent = {};

    for (let index = 0; index < questionShapeCount; index += 1) {
      const shape = shapes[Math.floor(random() * shapes.length)];
      questionLeft[shape] = (questionLeft[shape] ?? 0) + 1;
    }

    if (calculatePanWeight(referenceLeft, weights) !== calculatePanWeight(referenceRight, weights)) {
      continue;
    }

    const explanation =
      "Ağırlıklar:\n" +
      shapes
        .filter((shape) => weights[shape])
        .map((shape) => `• ${shape} = ${weights[shape]}`)
        .join("\n") +
      `\nSol: ${calculatePanWeight(questionLeft, weights)}`;

    return {
      levelNumber: level,
      weights,
      referenceEquation: { left: referenceLeft, right: referenceRight },
      question: { left: questionLeft },
      description:
        level <= 2
          ? "Kuralı çöz ve soru terazisini dengele!"
          : "İpucu terazisinden kuralı bul!",
      detailedExplanation: explanation,
    };
  }

  const fallbackWeights = generateWeights(shapes, level, random);
  const fallbackLeft: PanContent = {};

  for (let index = 0; index < referenceShapeCount; index += 1) {
    const shape = shapes[index % shapes.length];
    fallbackLeft[shape] = (fallbackLeft[shape] ?? 0) + 1;
  }

  const fallbackQuestion: PanContent = {};

  for (let index = 0; index < questionShapeCount; index += 1) {
    const shape = shapes[Math.floor(random() * shapes.length)];
    fallbackQuestion[shape] = (fallbackQuestion[shape] ?? 0) + 1;
  }

  return {
    levelNumber: level,
    weights: fallbackWeights,
    referenceEquation: { left: fallbackLeft, right: { ...fallbackLeft } },
    question: { left: fallbackQuestion },
    description:
      level <= 2
        ? "Kuralı çöz ve soru terazisini dengele!"
        : "İpucu terazisinden kuralı bul!",
    detailedExplanation:
      "Ağırlıklar:\n" +
      shapes
        .filter((shape) => fallbackWeights[shape])
        .map((shape) => `• ${shape} = ${fallbackWeights[shape]}`)
        .join("\n") +
      `\nSol: ${calculatePanWeight(fallbackQuestion, fallbackWeights)}`,
  };
};
