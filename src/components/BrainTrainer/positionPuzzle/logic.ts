import { INTERNAL_SIZE, SHAPE_COLORS_CYBERPOP } from "./constants.ts";
import { isPointInShape, rotatePoint } from "./geometry.ts";
import type { Point, PuzzleOption, PuzzleState, Shape } from "./types.ts";

const REGION_SAMPLE_COUNT = 600;
const VALID_REGION_MIN_POINTS = 10;
const MAX_GENERATION_ATTEMPTS = 30;
const OPTION_ROTATIONS = [0, 90, 180, 270] as const;

const getRandomInt = (
  random: () => number,
  min: number,
  max: number,
) => Math.floor(random() * (max - min + 1)) + min;

const getRandomItem = <T,>(items: T[], random: () => number): T =>
  items[getRandomInt(random, 0, items.length - 1)];

const shuffleArray = <T,>(items: T[], random: () => number): T[] => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomInt(random, 0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const countActiveShapes = (signature: string) =>
  signature.split("").filter((flag) => flag === "1").length;

const createCircle = (
  index: number,
  cx: number,
  cy: number,
  color: string,
  random: () => number,
): Shape => ({
  id: `s-${index}`,
  type: "circle",
  color,
  rotation: 0,
  cx,
  cy,
  r: getRandomInt(random, 40, 70),
});

const createRect = (
  index: number,
  cx: number,
  cy: number,
  color: string,
  rotation: number,
  random: () => number,
): Shape => {
  const width = getRandomInt(random, 80, 140);
  const height = getRandomInt(random, 80, 140);

  return {
    id: `s-${index}`,
    type: "rect",
    color,
    rotation,
    x: cx - width / 2,
    y: cy - height / 2,
    w: width,
    h: height,
  };
};

const createTriangle = (
  index: number,
  cx: number,
  cy: number,
  color: string,
  rotation: number,
  random: () => number,
): Shape => {
  const sideLength = getRandomInt(random, 80, 140);
  const height = (Math.sqrt(3) / 2) * sideLength;
  const center = { x: cx, y: cy };

  return {
    id: `s-${index}`,
    type: "triangle",
    color,
    rotation,
    p1: rotatePoint({ x: cx, y: cy - (2 / 3) * height }, center, rotation),
    p2: rotatePoint(
      { x: cx - sideLength / 2, y: cy + (1 / 3) * height },
      center,
      rotation,
    ),
    p3: rotatePoint(
      { x: cx + sideLength / 2, y: cy + (1 / 3) * height },
      center,
      rotation,
    ),
  };
};

const createShapes = (level: number, random: () => number): Shape[] => {
  const shapeCount = level <= 8 ? 2 : 3;
  const padding = 60;
  const colors = shuffleArray(SHAPE_COLORS_CYBERPOP, random);

  return Array.from({ length: shapeCount }, (_, index) => {
    const type = getRandomInt(random, 0, 2);
    const color = colors[index % colors.length];
    const rotation = getRandomInt(random, 0, 359);
    const cx = getRandomInt(random, padding, INTERNAL_SIZE - padding);
    const cy = getRandomInt(random, padding, INTERNAL_SIZE - padding);

    if (type === 0) {
      return createCircle(index, cx, cy, color, random);
    }

    if (type === 1) {
      return createRect(index, cx, cy, color, rotation, random);
    }

    return createTriangle(index, cx, cy, color, rotation, random);
  });
};

const createRegionMap = (
  shapes: Shape[],
  random: () => number,
): Map<string, Point[]> => {
  const regionMap = new Map<string, Point[]>();

  for (let index = 0; index < REGION_SAMPLE_COUNT; index += 1) {
    const point = {
      x: getRandomInt(random, 0, INTERNAL_SIZE - 1),
      y: getRandomInt(random, 0, INTERNAL_SIZE - 1),
    };
    const signature = shapes
      .map((shape) => (isPointInShape(point, shape) ? "1" : "0"))
      .join("");

    if (!signature.includes("1")) {
      continue;
    }

    const existing = regionMap.get(signature);
    if (existing) {
      existing.push(point);
      continue;
    }

    regionMap.set(signature, [point]);
  }

  return regionMap;
};

const createOptions = (
  targetSignature: string,
  validRegions: Array<[string, Point[]]>,
  random: () => number,
): { options: PuzzleOption[]; correctOptionId: number } | null => {
  const targetRegion = validRegions.find(([signature]) => signature === targetSignature);
  const distractorRegions = validRegions.filter(
    ([signature]) => signature !== targetSignature,
  );

  if (!targetRegion || distractorRegions.length === 0) {
    return null;
  }

  const [, targetPoints] = targetRegion;
  const correctOptionId = getRandomInt(random, 0, 3);

  const options = Array.from({ length: 4 }, (_, id) => {
    const rotation = getRandomItem([...OPTION_ROTATIONS], random);
    const points =
      id === correctOptionId
        ? targetPoints
        : getRandomItem(distractorRegions, random)[1];

    return {
      id,
      rotation,
      point: getRandomItem(points, random),
    };
  });

  return { options, correctOptionId };
};

export const generatePuzzle = (
  level: number,
  random: () => number = Math.random,
): PuzzleState | null => {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const shapes = createShapes(level, random);
    const regionMap = createRegionMap(shapes, random);
    const validRegions = Array.from(regionMap.entries()).filter(
      ([, points]) => points.length > VALID_REGION_MIN_POINTS,
    );

    if (validRegions.length < 2) {
      continue;
    }

    const intersectingRegions = validRegions.filter(([signature]) => {
      return countActiveShapes(signature) >= 2;
    });
    const candidateRegions =
      intersectingRegions.length > 0 ? intersectingRegions : validRegions;
    const [targetSignature, targetPoints] = getRandomItem(candidateRegions, random);
    const targetPoint = getRandomItem(targetPoints, random);
    const optionSet = createOptions(targetSignature, validRegions, random);

    if (!optionSet) {
      continue;
    }

    return {
      shapes,
      targetPoint,
      options: optionSet.options,
      correctOptionId: optionSet.correctOptionId,
    };
  }

  return null;
};

export const createPuzzleForLevel = (
  level: number,
  random: () => number = Math.random,
  maxRetries = 6,
): PuzzleState | null => {
  let puzzle: PuzzleState | null = null;

  for (let retry = 0; retry < maxRetries && !puzzle; retry += 1) {
    puzzle = generatePuzzle(level, random);
  }

  return puzzle;
};
