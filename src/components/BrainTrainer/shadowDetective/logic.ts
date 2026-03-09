import {
  OPTION_COUNT,
  PATTERN_COLORS,
  PREVIEW_SECONDS,
  SHAPE_IDS,
  SYMMETRIC_SHAPE_IDS,
} from "./constants.ts";
import type { PatternItem, ShadowDetectiveRound, ShapeId } from "./types.ts";

const POSITION_MIN = 15;
const POSITION_MAX = 85;
const MIN_SPACING = 25;
const POSITION_ATTEMPTS = 50;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const randomIndex = (length: number, random: () => number) =>
  Math.floor(random() * length);

const pickRandom = <T,>(items: readonly T[], random: () => number) =>
  items[randomIndex(items.length, random)];

const createPatternId = (index: number, random: () => number) =>
  `shadow-${index}-${Math.floor(random() * 1_000_000_000).toString(36)}`;

export const getPatternSignature = (pattern: PatternItem[]) =>
  pattern
    .map(
      (item) =>
        `${item.shapeId}-${item.color}-${Math.round(item.x)}-${Math.round(
          item.y,
        )}-${item.rotation}-${item.scale.toFixed(2)}`,
    )
    .sort()
    .join("|");

export const getItemCountForLevel = (level: number) =>
  Math.min(6, 2 + Math.floor(level / 4));

const getCoordinates = (items: PatternItem[], random: () => number) => {
  let x = 50;
  let y = 50;
  let attempts = 0;

  do {
    x = random() * 70 + POSITION_MIN;
    y = random() * 70 + POSITION_MIN;
    attempts += 1;
  } while (
    attempts < POSITION_ATTEMPTS &&
    items.some(
      (item) => Math.hypot(item.x - x, item.y - y) < MIN_SPACING,
    )
  );

  return { x, y };
};

export const createPattern = (
  count: number,
  random: () => number = Math.random,
): PatternItem[] => {
  const items: PatternItem[] = [];

  for (let index = 0; index < count; index += 1) {
    const { x, y } = getCoordinates(items, random);

    items.push({
      id: createPatternId(index, random),
      shapeId: pickRandom(SHAPE_IDS, random),
      color: pickRandom(PATTERN_COLORS, random),
      x,
      y,
      rotation: Math.floor(random() * 8) * 45,
      scale: 0.9 + random() * 0.5,
    });
  }

  return items;
};

const clonePattern = (pattern: PatternItem[]) =>
  pattern.map((item) => ({ ...item }));

const pickDifferentShapeId = (shapeId: ShapeId, random: () => number) => {
  const availableShapeIds = SHAPE_IDS.filter((value) => value !== shapeId);
  return pickRandom(availableShapeIds, random);
};

export const createDistractor = (
  basePattern: PatternItem[],
  random: () => number = Math.random,
) => {
  const distractor = clonePattern(basePattern);
  const baseColors = new Set(basePattern.map((item) => item.color));
  const contrastColors = PATTERN_COLORS.filter((color) => !baseColors.has(color));
  const colorIndex = randomIndex(distractor.length, random);
  const colorItem = distractor[colorIndex];
  const availableColors =
    contrastColors.length > 0
      ? contrastColors
      : PATTERN_COLORS.filter((color) => color !== colorItem.color);

  distractor[colorIndex] = {
    ...colorItem,
    color: pickRandom(availableColors, random),
  };

  if (random() <= 0.4) {
    return distractor;
  }

  let mutationIndex = colorIndex;
  while (mutationIndex === colorIndex && distractor.length > 1) {
    mutationIndex = randomIndex(distractor.length, random);
  }

  const currentItem = distractor[mutationIndex];
  const mutationTypes: Array<"rotation" | "shape" | "position"> = [
    "rotation",
    "shape",
    "position",
  ];

  if (SYMMETRIC_SHAPE_IDS.has(currentItem.shapeId)) {
    mutationTypes.splice(mutationTypes.indexOf("rotation"), 1);
  }

  const mutationType = pickRandom(mutationTypes, random);

  if (mutationType === "rotation") {
    distractor[mutationIndex] = {
      ...currentItem,
      rotation:
        (currentItem.rotation + (random() > 0.5 ? 90 : 180)) % 360,
    };
    return distractor;
  }

  if (mutationType === "shape") {
    distractor[mutationIndex] = {
      ...currentItem,
      shapeId: pickDifferentShapeId(currentItem.shapeId, random),
    };
    return distractor;
  }

  const shift = 20 + Math.floor(random() * 15);

  distractor[mutationIndex] = {
    ...currentItem,
    x: clamp(
      currentItem.x + (currentItem.x > 50 ? -shift : shift),
      POSITION_MIN,
      POSITION_MAX,
    ),
    y: clamp(
      currentItem.y + (currentItem.y > 50 ? -shift : shift),
      POSITION_MIN,
      POSITION_MAX,
    ),
  };

  return distractor;
};

const shuffle = <T,>(items: T[], random: () => number) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

export const createRound = (
  level: number,
  random: () => number = Math.random,
): ShadowDetectiveRound => {
  const correctPattern = createPattern(getItemCountForLevel(level), random);
  const correctSignature = getPatternSignature(correctPattern);
  const options: PatternItem[][] = [correctPattern];
  const signatures = new Set([correctSignature]);
  let attempts = 0;

  while (options.length < OPTION_COUNT && attempts < 250) {
    const distractor = createDistractor(correctPattern, random);
    const signature = getPatternSignature(distractor);

    if (!signatures.has(signature)) {
      options.push(distractor);
      signatures.add(signature);
    }

    attempts += 1;
  }

  while (options.length < OPTION_COUNT) {
    const fallback = createPattern(getItemCountForLevel(level), random);
    const signature = getPatternSignature(fallback);

    if (!signatures.has(signature)) {
      options.push(fallback);
      signatures.add(signature);
    }
  }

  const shuffledOptions = shuffle(options, random);

  return {
    correctPattern,
    options: shuffledOptions,
    correctOptionIndex: shuffledOptions.findIndex(
      (option) => getPatternSignature(option) === correctSignature,
    ),
    previewSeconds: PREVIEW_SECONDS,
  };
};

export const calculateShadowDetectiveScore = (level: number) => level * 10;
