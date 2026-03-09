import {
  PATTERN_COLORS,
  PATTERN_TYPES,
  PIECE_SIZE,
  SVG_SIZE,
} from "./constants.ts";
import type {
  GameOption,
  PartWholeRound,
  PatternLayer,
  PatternProps,
} from "./types.ts";

type RandomFn = () => number;

const randInt = (random: RandomFn, min: number, max: number) =>
  Math.floor(random() * (max - min + 1)) + min;

const pick = <T,>(items: T[], random: RandomFn) =>
  items[Math.floor(random() * items.length)];

const shuffle = <T,>(items: T[], random: RandomFn) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randInt(random, 0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const createPatternId = (random: RandomFn) =>
  `p-${Math.floor(random() * 0xffffffff).toString(36)}`;

const createScribblePath = (size: number, random: RandomFn) => {
  const points = Array.from({ length: 4 }, () => ({
    x: random() * size,
    y: random() * size,
  }));

  return `M${points[0].x},${points[0].y} Q${points[1].x},${points[1].y} ${points[2].x},${points[2].y} T${points[3].x},${points[3].y}`;
};

export const buildPatternDefs = (pattern: PatternLayer) => {
  const {
    backgroundColor,
    foregroundColor,
    id,
    props,
    size,
    type,
  } = pattern;
  const strokeWidth = size / 6;
  const backgroundRect = `<rect width="${size}" height="${size}" fill="${backgroundColor}"/>`;

  switch (type) {
    case "dots":
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${backgroundRect}<circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="${foregroundColor}"/></pattern>`;
    case "stripes":
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${backgroundRect}<rect width="${size}" height="${size / 3}" fill="${foregroundColor}"/></pattern>`;
    case "zigzag":
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${backgroundRect}<path d="M0 0 L${size / 2} ${size} L${size} 0" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/></pattern>`;
    case "waves":
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${backgroundRect}<path d="M0 ${size / 2} Q${size / 4} 0 ${size / 2} ${size / 2} T${size} ${size / 2}" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/></pattern>`;
    case "checkerboard":
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${backgroundRect}<rect width="${size / 2}" height="${size / 2}" fill="${foregroundColor}"/><rect x="${size / 2}" y="${size / 2}" width="${size / 2}" height="${size / 2}" fill="${foregroundColor}"/></pattern>`;
    case "crosshatch":
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${backgroundRect}<path d="M0 0 L${size} ${size} M0 ${size} L${size} 0" stroke="${foregroundColor}" stroke-width="${strokeWidth}"/></pattern>`;
    case "star": {
      const points = props?.points ?? 5;
      let path = "";

      for (let index = 0; index < points * 2; index += 1) {
        const radius = index % 2 === 0 ? size / 2.5 : size / 4;
        const x = size / 2 + Math.cos((index * Math.PI) / points) * radius;
        const y = size / 2 + Math.sin((index * Math.PI) / points) * radius;
        path += `${index === 0 ? "M" : "L"}${x},${y}`;
      }

      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${backgroundRect}<path d="${path}Z" fill="${foregroundColor}"/></pattern>`;
    }
    case "polygon": {
      const sides = props?.sides ?? 6;
      let path = "";

      for (let index = 0; index < sides; index += 1) {
        const x = size / 2 + Math.cos((index * 2 * Math.PI) / sides) * (size / 2.5);
        const y = size / 2 + Math.sin((index * 2 * Math.PI) / sides) * (size / 2.5);
        path += `${index === 0 ? "M" : "L"}${x},${y}`;
      }

      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${backgroundRect}<path d="${path}Z" fill="${foregroundColor}"/></pattern>`;
    }
    case "scribble":
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${backgroundRect}<path d="${props?.pathData ?? ""}" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}" stroke-linecap="round"/></pattern>`;
    case "burst": {
      const lines = props?.lines ?? 8;
      let path = "";

      for (let index = 0; index < lines; index += 1) {
        const x2 = size / 2 + Math.cos((index * 2 * Math.PI) / lines) * (size / 2);
        const y2 = size / 2 + Math.sin((index * 2 * Math.PI) / lines) * (size / 2);
        path += `M${size / 2},${size / 2} L${x2},${y2} `;
      }

      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${backgroundRect}<path d="${path}" stroke="${foregroundColor}" stroke-width="${strokeWidth}"/></pattern>`;
    }
  }
};

export const createPatternLayer = (random: RandomFn = Math.random) => {
  const type = pick(PATTERN_TYPES, random);
  const backgroundColor = pick(PATTERN_COLORS, random);
  const foregroundOptions = PATTERN_COLORS.filter(
    (color) => color !== backgroundColor,
  );
  const foregroundColor = pick(foregroundOptions, random);
  const size = 30 + random() * 40;
  const props: PatternProps = {};

  if (type === "star") {
    props.points = 4 + randInt(random, 0, 4);
  }

  if (type === "polygon") {
    props.sides = 3 + randInt(random, 0, 5);
  }

  if (type === "burst") {
    props.lines = 6 + randInt(random, 0, 9);
  }

  if (type === "scribble") {
    props.pathData = createScribblePath(size, random);
  }

  const pattern: PatternLayer = {
    defs: "",
    type,
    backgroundColor,
    foregroundColor,
    size,
    rotation: random() * 360,
    opacity: 0.85 + random() * 0.15,
    id: createPatternId(random),
    props,
  };

  return {
    ...pattern,
    defs: buildPatternDefs(pattern),
  };
};

export const distortColor = (
  hex: string,
  intensity = 15,
  random: RandomFn = Math.random,
) => {
  const channels = [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];

  return `#${channels
    .map((channel) =>
      Math.max(
        0,
        Math.min(
          255,
          channel + Math.round((random() - 0.5) * intensity),
        ),
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

export const getPatternCountForLevel = (level: number) =>
  Math.min(Math.floor(level / 3) + 2, 8);

const createDistractorOption = (
  sourcePattern: PatternLayer[],
  level: number,
  random: RandomFn,
): GameOption => ({
  pattern: sourcePattern.map((pattern) => {
    const nextPattern: PatternLayer = {
      ...pattern,
      id: createPatternId(random),
      rotation: pattern.rotation + (random() - 0.5) * (level + 5),
      size: pattern.size * (0.9 + random() * 0.2),
      backgroundColor: distortColor(pattern.backgroundColor, 15, random),
      foregroundColor: distortColor(pattern.foregroundColor, 15, random),
    };

    return {
      ...nextPattern,
      defs: buildPatternDefs(nextPattern),
    };
  }),
  isCorrect: false,
});

export const createRound = (
  level: number,
  random: RandomFn = Math.random,
  svgSize = SVG_SIZE,
  pieceSize = PIECE_SIZE,
): PartWholeRound => {
  const gamePattern = Array.from(
    { length: getPatternCountForLevel(level) },
    () => createPatternLayer(random),
  );
  const targetPos = {
    x: randInt(random, 0, svgSize - pieceSize),
    y: randInt(random, 0, svgSize - pieceSize),
  };
  const correctOption: GameOption = {
    pattern: gamePattern,
    isCorrect: true,
  };
  const options = shuffle(
    [
      correctOption,
      createDistractorOption(gamePattern, level, random),
      createDistractorOption(gamePattern, level, random),
      createDistractorOption(gamePattern, level, random),
    ],
    random,
  );

  return {
    gamePattern,
    options,
    targetPos,
  };
};

export const getRoundScore = (level: number) => 100 + level * 20;
