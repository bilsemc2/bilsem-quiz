import {
  COLORS,
  COLOR_NAMES,
  SHAPES,
  SHAPE_NAMES,
} from "./constants.ts";
import type { ColorType, GameObject, RoundData, ShapeType } from "./types.ts";

type RandomFn = () => number;

const pick = <T,>(items: readonly T[], random: RandomFn): T =>
  items[Math.floor(random() * items.length)];

const createObjectId = (random: RandomFn) =>
  Math.floor(random() * 1_000_000_000)
    .toString(36)
    .padStart(6, "0");

const createGameObject = (random: RandomFn): GameObject => ({
  id: createObjectId(random),
  shape: pick(SHAPES, random),
  color: pick(COLORS, random),
});

const getLogicTypeCount = (level: number) => (level < 5 ? 3 : 6);

const getObjectKey = (object: Pick<GameObject, "color" | "shape">) =>
  `${object.color}-${object.shape}`;

const countObjectKeys = (objects: GameObject[]) => {
  return objects.reduce<Record<string, number>>((counts, object) => {
    const key = getObjectKey(object);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
};

export const getObjectCount = (level: number) => {
  if (level <= 5) {
    return 4;
  }

  if (level <= 12) {
    return 6;
  }

  return 8;
};

const createFallbackObjects = (
  count: number,
  random: RandomFn,
): GameObject[] => {
  const protectedKeys = new Set(["Red-Circle", "Blue-Square"]);
  const objects: GameObject[] = [
    { id: createObjectId(random), shape: "Circle", color: "Red" },
    { id: createObjectId(random), shape: "Square", color: "Blue" },
  ];

  while (objects.length < count) {
    let object = createGameObject(random);

    while (protectedKeys.has(getObjectKey(object))) {
      object = createGameObject(random);
    }

    objects.push(object);
  }

  return objects;
};

const createObjectsWithSingletonTargets = (
  count: number,
  random: RandomFn,
) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const objects = Array.from({ length: count }, () => createGameObject(random));
    const comboCounts = countObjectKeys(objects);
    const singletons = objects.filter(
      (object) => comboCounts[getObjectKey(object)] === 1,
    );

    if (singletons.length >= 2) {
      return { objects, singletons };
    }
  }

  const fallbackObjects = createFallbackObjects(count, random);
  return {
    objects: fallbackObjects,
    singletons: fallbackObjects.slice(0, 2),
  };
};

export const describeObject = (object: Pick<GameObject, "color" | "shape">) =>
  `${COLOR_NAMES[object.color]} ${SHAPE_NAMES[object.shape]}`;

const createConditionalText = (
  objects: GameObject[],
  level: number,
  random: RandomFn,
) => {
  const logicType = Math.floor(random() * getLogicTypeCount(level));

  if (logicType === 0) {
    const test =
      random() > 0.5
        ? pick(objects, random)
        : {
            color: pick(COLORS, random),
            shape: pick(SHAPES, random),
          };
    const isTrue = objects.some(
      (object) => object.color === test.color && object.shape === test.shape,
    );

    return {
      text: `bir ${COLOR_NAMES[test.color as ColorType]} ${SHAPE_NAMES[test.shape as ShapeType]} varsa`,
      isTrue,
    };
  }

  if (logicType === 1) {
    const color = pick(COLORS, random);
    const count = objects.filter((object) => object.color === color).length;
    const threshold = Math.max(0, count - 1 + Math.floor(random() * 2));
    return {
      text: `${threshold} taneden fazla ${COLOR_NAMES[color]} nesne varsa`,
      isTrue: count > threshold,
    };
  }

  if (logicType === 2) {
    const shape = pick(SHAPES, random);
    const count = objects.filter((object) => object.shape === shape).length;
    const threshold = Math.max(1, count - 1 + Math.floor(random() * 2));
    return {
      text: `${threshold} taneden az ${SHAPE_NAMES[shape]} varsa`,
      isTrue: count < threshold,
    };
  }

  if (logicType === 3) {
    const color = pick(COLORS, random);
    return {
      text: `hiç ${COLOR_NAMES[color]} nesne yoksa`,
      isTrue: objects.every((object) => object.color !== color),
    };
  }

  if (logicType === 4) {
    const firstColor = pick(COLORS, random);
    let secondColor = pick(COLORS, random);

    while (secondColor === firstColor) {
      secondColor = pick(COLORS, random);
    }

    const firstCount = objects.filter(
      (object) => object.color === firstColor,
    ).length;
    const secondCount = objects.filter(
      (object) => object.color === secondColor,
    ).length;

    return {
      text: `${COLOR_NAMES[firstColor]} nesne sayısı ${COLOR_NAMES[secondColor]} olanlardan fazlaysa`,
      isTrue: firstCount > secondCount,
    };
  }

  const shape = pick(SHAPES, random);
  const color = pick(COLORS, random);
  const shapeCount = objects.filter((object) => object.shape === shape).length;
  const colorCount = objects.filter((object) => object.color === color).length;

  return {
    text: `${SHAPE_NAMES[shape]} sayısı ${COLOR_NAMES[color]} nesne sayısına eşitse`,
    isTrue: shapeCount === colorCount,
  };
};

export const generateRound = (
  level: number,
  random: RandomFn = Math.random,
): RoundData => {
  const count = getObjectCount(level);
  const { objects, singletons } = createObjectsWithSingletonTargets(count, random);
  const firstTarget = pick(singletons, random);
  let secondTarget = pick(singletons, random);

  while (secondTarget.id === firstTarget.id) {
    secondTarget = pick(singletons, random);
  }

  const condition = createConditionalText(objects, level, random);
  const target = condition.isTrue ? firstTarget : secondTarget;
  const instruction = `Eğer ${condition.text}, ${describeObject(firstTarget)} nesnesini seç, değilse ${describeObject(secondTarget)} nesnesini seç.`;

  return {
    objects,
    instruction,
    targetId: target.id,
  };
};

export const evaluateConditionalSelection = (
  selectedId: string,
  targetId: string,
) => selectedId === targetId;

export const calculateConditionalLogicScore = (level: number) => 10 * level;
