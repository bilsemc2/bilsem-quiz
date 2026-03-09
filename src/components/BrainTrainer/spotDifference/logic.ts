import { SHAPES } from "./constants.ts";
import type { DiffType, RoundData, TileData, TileDecor, TileStyle } from "./types.ts";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const randInt = (random: () => number, min: number, max: number) =>
  Math.floor(random() * (max - min + 1)) + min;

const pick = <T,>(items: T[], random: () => number): T =>
  items[Math.floor(random() * items.length)];

export const createDecor = (random: () => number = Math.random): TileDecor => ({
  d1x: randInt(random, 8, 58),
  d1y: randInt(random, 6, 56),
  d1s: randInt(random, 18, 32),
  d2x: randInt(random, 32, 72),
  d2y: randInt(random, 30, 70),
  d2s: randInt(random, 12, 24),
});

export const getLevelConfig = (level: number) => {
  const gridMin = Math.min(3 + Math.floor(level / 5), 5);
  const gridMax = Math.min(gridMin + 1, 6);
  const perRoundTime = Math.max(5, 15 - Math.floor(level / 3));
  const diffFactor = Math.max(0.3, 1 - (level - 1) * 0.035);
  const allTypes: DiffType[] = [
    "lightness",
    "hue",
    "radius",
    "scale",
    "rotation",
    "shape",
  ];
  const types = allTypes.slice(
    0,
    Math.min(allTypes.length, 3 + Math.floor(level / 4)),
  );

  return {
    gridMin,
    gridMax,
    perRoundTime,
    types,
    deltas: {
      lightness: Math.round(24 * diffFactor),
      hue: Math.round(22 * diffFactor),
      radius: Math.round(28 * diffFactor),
      scale: +(0.16 * diffFactor).toFixed(3),
      rotation: Math.round(14 * diffFactor),
    },
  };
};

export const createRound = (
  level: number,
  random: () => number = Math.random,
): RoundData => {
  const config = getLevelConfig(level);
  const size = randInt(random, config.gridMin, config.gridMax);
  const total = size * size;
  const oddIndex = randInt(random, 0, total - 1);
  const diffType = pick(config.types, random);
  const baseShape = pick(SHAPES, random);
  const base: TileStyle = {
    hue: randInt(random, 0, 360),
    sat: randInt(random, 62, 88),
    light: randInt(random, 50, 72),
    radius: randInt(random, 10, 48),
    rotate: randInt(random, -10, 10),
    scale: 1,
  };
  const odd: TileStyle = { ...base };
  let oddShape = baseShape;
  const sign = random() > 0.5 ? 1 : -1;

  if (diffType === "shape") {
    oddShape = pick(
      SHAPES.filter((shape) => shape.id !== baseShape.id),
      random,
    );
  } else if (diffType === "lightness") {
    odd.light = clamp(base.light + sign * config.deltas.lightness, 18, 82);
  } else if (diffType === "hue") {
    odd.hue = (base.hue + sign * config.deltas.hue + 360) % 360;
  } else if (diffType === "radius") {
    odd.radius = clamp(base.radius + sign * config.deltas.radius, 4, 70);
  } else if (diffType === "scale") {
    odd.scale = clamp(base.scale + sign * config.deltas.scale, 0.74, 1.22);
  } else if (diffType === "rotation") {
    odd.rotate = base.rotate + sign * config.deltas.rotation;
  }

  return {
    size,
    total,
    oddIndex,
    diffType,
    baseShape,
    oddShape,
    base,
    odd,
    perRoundTime: config.perRoundTime,
  };
};

export const createTiles = (
  roundData: RoundData,
  random: () => number = Math.random,
): TileData[] => {
  return Array.from({ length: roundData.total }, (_, index) => ({
    index,
    style: index === roundData.oddIndex ? roundData.odd : roundData.base,
    shape: index === roundData.oddIndex ? roundData.oddShape : roundData.baseShape,
    decor: createDecor(random),
  }));
};

export const calculateSpotDifferenceScore = (
  level: number,
  roundTimeLeft: number,
) => 10 * level + Math.round(roundTimeLeft * 5);
