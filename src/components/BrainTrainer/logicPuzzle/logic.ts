import {
  AVAILABLE_COLORS,
  AVAILABLE_SHAPES,
  COLOR_LABELS,
  OPTION_COUNT,
  TYPE_LABELS,
} from "./constants.ts";
import type {
  PuzzleData,
  ShapeColor,
  ShapeData,
  ShapeFill,
  ShapeGroupData,
  ShapeType,
} from "./types.ts";

const AVAILABLE_FILLS: readonly ShapeFill[] = ["solid", "outline", "striped"];

const generateId = (random: () => number) =>
  `logic-${Math.floor(random() * 1_000_000_000).toString(36)}`;

const randomInt = (min: number, max: number, random: () => number) =>
  Math.floor(random() * (max - min + 1)) + min;

const randomItem = <T,>(items: readonly T[], random: () => number): T =>
  items[randomInt(0, items.length - 1, random)];

export const shuffle = <T,>(items: readonly T[], random: () => number) => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index, random);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
};

export const translateColor = (color: ShapeColor) => COLOR_LABELS[color];

export const translateType = (shapeType: ShapeType) => TYPE_LABELS[shapeType];

export const generateShape = (
  random: () => number = Math.random,
  overrides: Partial<ShapeData> = {},
): ShapeData => ({
  id: generateId(random),
  type: randomItem(AVAILABLE_SHAPES, random),
  color: randomItem(AVAILABLE_COLORS, random),
  fill: randomItem(AVAILABLE_FILLS, random),
  rotation: randomInt(0, 360, random),
  ...overrides,
});

export const generateGroup = (
  count: number,
  constraintFn: (index: number) => Partial<ShapeData>,
  random: () => number = Math.random,
): ShapeGroupData => ({
  id: generateId(random),
  shapes: Array.from({ length: count }, (_, index) =>
    generateShape(random, constraintFn(index)),
  ),
});

export const createSameColorPuzzle = (
  random: () => number = Math.random,
): PuzzleData => {
  const targetColor = randomItem(AVAILABLE_COLORS, random);
  const wrongColors = shuffle(
    AVAILABLE_COLORS.filter((color) => color !== targetColor),
    random,
  ).slice(0, OPTION_COUNT - 1);

  return {
    ruleName: "Renk Uyumu",
    ruleDescription: `Tüm şekiller ${translateColor(targetColor)}.`,
    examples: [
      generateGroup(2, () => ({ color: targetColor }), random),
      generateGroup(2, () => ({ color: targetColor }), random),
    ],
    options: shuffle(
      [
        {
          group: generateGroup(2, () => ({ color: targetColor }), random),
          isCorrect: true,
        },
        ...wrongColors.map((color) => ({
          group: generateGroup(2, () => ({ color }), random),
          isCorrect: false,
        })),
      ],
      random,
    ),
  };
};

export const createSameTypePuzzle = (
  random: () => number = Math.random,
): PuzzleData => {
  const targetType = randomItem(AVAILABLE_SHAPES, random);
  const wrongTypes = shuffle(
    AVAILABLE_SHAPES.filter((shapeType) => shapeType !== targetType),
    random,
  ).slice(0, OPTION_COUNT - 1);

  return {
    ruleName: "Şekil Benzerliği",
    ruleDescription: `Tüm şekiller birer ${translateType(targetType)}.`,
    examples: [
      generateGroup(2, () => ({ type: targetType }), random),
      generateGroup(2, () => ({ type: targetType }), random),
    ],
    options: shuffle(
      [
        {
          group: generateGroup(2, () => ({ type: targetType }), random),
          isCorrect: true,
        },
        ...wrongTypes.map((type) => ({
          group: generateGroup(2, () => ({ type }), random),
          isCorrect: false,
        })),
      ],
      random,
    ),
  };
};

export const createCountMatchPuzzle = (
  random: () => number = Math.random,
): PuzzleData => {
  const targetCount = randomInt(1, 4, random);
  const wrongCounts = shuffle(
    [1, 2, 3, 4].filter((count) => count !== targetCount),
    random,
  ).slice(0, OPTION_COUNT - 1);

  return {
    ruleName: "Sayı Kuralı",
    ruleDescription: `Grupta tam olarak ${targetCount} adet şekil var.`,
    examples: [
      generateGroup(targetCount, () => ({}), random),
      generateGroup(targetCount, () => ({}), random),
    ],
    options: shuffle(
      [
        {
          group: generateGroup(targetCount, () => ({}), random),
          isCorrect: true,
        },
        ...wrongCounts.map((count) => ({
          group: generateGroup(count, () => ({}), random),
          isCorrect: false,
        })),
      ],
      random,
    ),
  };
};

const PUZZLE_FACTORIES = [
  createSameColorPuzzle,
  createSameTypePuzzle,
  createCountMatchPuzzle,
] as const;

export const createPuzzle = (random: () => number = Math.random) =>
  randomItem(PUZZLE_FACTORIES, random)(random);

export const calculateLogicPuzzleScore = (level: number) => 10 * level;
