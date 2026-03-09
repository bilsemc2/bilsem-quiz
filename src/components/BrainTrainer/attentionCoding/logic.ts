import { ALL_SHAPES } from "./constants.ts";
import type { AttentionCodingRound, KeyMapping, ShapeType, TestItem } from "./types.ts";

export const shuffleItems = <T,>(
  items: readonly T[],
  random: () => number = Math.random,
) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const getShapeCountForLevel = (level: number) => {
  if (level <= 5) {
    return 5;
  }

  if (level <= 10) {
    return 6;
  }

  return 7;
};

export const getItemCountForLevel = (level: number) => {
  if (level <= 3) {
    return 5;
  }

  if (level <= 7) {
    return 6;
  }

  if (level <= 12) {
    return 7;
  }

  if (level <= 16) {
    return 8;
  }

  return 9;
};

export const createKeyMappings = (
  level: number,
  random: () => number = Math.random,
  shapes: readonly ShapeType[] = ALL_SHAPES,
): KeyMapping[] => {
  const shapeCount = getShapeCountForLevel(level);
  const selectedShapes = shuffleItems(shapes, random).slice(0, shapeCount);

  return selectedShapes.map((shape, index) => ({
    number: index + 1,
    shape,
  }));
};

export const createTestItems = (
  level: number,
  shapeCount: number,
  random: () => number = Math.random,
): TestItem[] => {
  const itemCount = getItemCountForLevel(level);

  return Array.from({ length: itemCount }, (_, index) => ({
    id: `${level}-${index}`,
    targetNumber: Math.floor(random() * shapeCount) + 1,
  }));
};

export const createAttentionCodingRound = (
  level: number,
  random: () => number = Math.random,
): AttentionCodingRound => {
  const keyMappings = createKeyMappings(level, random);

  return {
    keyMappings,
    items: createTestItems(level, keyMappings.length, random),
  };
};

export const getAvailableAnswerShapes = (
  keyMappings: readonly KeyMapping[],
  shapes: readonly ShapeType[] = ALL_SHAPES,
) => {
  return shapes.filter((shape) =>
    keyMappings.some((mapping) => mapping.shape === shape),
  );
};

export const getCorrectShape = (
  keyMappings: readonly KeyMapping[],
  targetNumber: number,
) => {
  return keyMappings.find((mapping) => mapping.number === targetNumber)?.shape ?? null;
};

export const isCorrectAnswer = (
  keyMappings: readonly KeyMapping[],
  targetNumber: number,
  selectedShape: ShapeType,
) => getCorrectShape(keyMappings, targetNumber) === selectedShape;

export const getAttentionCodingScore = (level: number) => 20 + level * 5;
