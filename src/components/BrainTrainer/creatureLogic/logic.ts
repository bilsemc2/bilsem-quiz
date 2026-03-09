import {
  ALL_ACCESSORIES,
  ALL_COLORS,
  ALL_EMOTIONS,
  ALL_SHAPES,
  TR,
} from "./constants.ts";
import type {
  Creature,
  CreatureColor,
  CreatureDifficulty,
  RoundData,
  RuleResult,
} from "./types.ts";

type RandomFn = () => number;

const pick = <T,>(items: readonly T[], random: RandomFn): T =>
  items[Math.floor(random() * items.length)];

const cap = (value: string) =>
  value.charAt(0).toLocaleUpperCase("tr-TR") + value.slice(1);

const createCreature = (id: number, random: RandomFn): Creature => ({
  id,
  color: pick(ALL_COLORS, random),
  shape: pick(ALL_SHAPES, random),
  accessory: pick(ALL_ACCESSORIES, random),
  emotion: pick(ALL_EMOTIONS, random),
});

export const getCreatureDifficulty = (
  level: number,
): CreatureDifficulty => {
  if (level <= 6) {
    return "easy";
  }

  if (level <= 13) {
    return "medium";
  }

  return "hard";
};

export const getCreatureCount = (level: number) => {
  if (level <= 5) {
    return 6;
  }

  if (level <= 12) {
    return 9;
  }

  return 12;
};

export const createEasyRule = (
  random: RandomFn = Math.random,
): RuleResult => {
  const type = Math.floor(random() * 4);

  if (type === 0) {
    const color = pick(ALL_COLORS, random);
    return {
      instruction: `${cap(TR.colors[color])} renkli tüm yaratıkları seç.`,
      predicate: (creature) => creature.color === color,
    };
  }

  if (type === 1) {
    const shape = pick(ALL_SHAPES, random);
    return {
      instruction: `${cap(TR.shapes[shape])} olan tüm yaratıkları seç.`,
      predicate: (creature) => creature.shape === shape,
    };
  }

  if (type === 2) {
    const accessory = pick(ALL_ACCESSORIES, random);
    return {
      instruction:
        accessory === "none"
          ? "Aksesuarı olmayan tüm yaratıkları seç."
          : `${cap(TR.accessories[accessory])} tüm yaratıkları seç.`,
      predicate: (creature) => creature.accessory === accessory,
    };
  }

  const emotion = pick(ALL_EMOTIONS, random);
  return {
    instruction: `${cap(TR.emotions[emotion])} görünen tüm yaratıkları seç.`,
    predicate: (creature) => creature.emotion === emotion,
  };
};

export const createMediumRule = (
  random: RandomFn = Math.random,
): RuleResult => {
  if (random() > 0.5) {
    const color = pick(ALL_COLORS, random);
    const accessory = pick(ALL_ACCESSORIES, random);
    const accessoryText =
      accessory === "none" ? "aksesuarsız" : TR.accessories[accessory];

    return {
      instruction: `${cap(TR.colors[color])} ve ${accessoryText} olanları seç.`,
      predicate: (creature) =>
        creature.color === color && creature.accessory === accessory,
    };
  }

  const color = pick(ALL_COLORS, random);
  const shape = pick(ALL_SHAPES, random);
  return {
    instruction: `${cap(TR.colors[color])} olan ama ${TR.shapes[shape]} olmayanları seç.`,
    predicate: (creature) =>
      creature.color === color && creature.shape !== shape,
  };
};

export const createHardRule = (
  creatures: Creature[],
  random: RandomFn = Math.random,
): RuleResult => {
  if (random() > 0.5) {
    const checkColor = pick(ALL_COLORS, random);
    const trueColor = pick(ALL_COLORS, random);
    let falseColor = pick(ALL_COLORS, random);

    while (falseColor === trueColor) {
      falseColor = pick(ALL_COLORS, random);
    }

    const exists = creatures.some((creature) => creature.color === checkColor);

    return {
      instruction: `Eğer ekranda en az bir ${TR.colors[checkColor]} yaratık varsa ${TR.colorsAcc[trueColor]} seç, yoksa ${TR.colorsAcc[falseColor]} seç.`,
      predicate: (creature) =>
        creature.color === (exists ? trueColor : falseColor),
    };
  }

  const firstColor = pick(ALL_COLORS, random);
  const firstShape = pick(ALL_SHAPES, random);
  let secondColor = pick(ALL_COLORS, random);

  while (secondColor === firstColor) {
    secondColor = pick(ALL_COLORS, random);
  }

  const secondShape = pick(ALL_SHAPES, random);

  return {
    instruction: `${cap(TR.colors[firstColor])} ${TR.shapes[firstShape]} VEYA ${TR.colors[secondColor]} ${TR.shapes[secondShape]} olanları seç.`,
    predicate: (creature) =>
      (creature.color === firstColor && creature.shape === firstShape) ||
      (creature.color === secondColor && creature.shape === secondShape),
  };
};

export const createRuleForDifficulty = (
  difficulty: CreatureDifficulty,
  creatures: Creature[],
  random: RandomFn = Math.random,
): RuleResult => {
  if (difficulty === "hard") {
    return createHardRule(creatures, random);
  }

  if (difficulty === "medium") {
    return createMediumRule(random);
  }

  return createEasyRule(random);
};

const createFallbackRule = (creatures: Creature[]): RuleResult => {
  const fallbackColor: CreatureColor = creatures[0]?.color ?? ALL_COLORS[0];
  return {
    instruction: `${cap(TR.colors[fallbackColor])} renkli tüm yaratıkları seç.`,
    predicate: (creature) => creature.color === fallbackColor,
  };
};

export const getCreatureTraitLines = (creature: Creature): string[] => [
  `Renk: ${TR.colors[creature.color]}`,
  `Tip: ${TR.shapes[creature.shape]}`,
  `Aksesuar: ${TR.accessories[creature.accessory]}`,
  `Duygu: ${TR.emotions[creature.emotion]}`,
];

export const toggleCreatureSelection = (
  selectedIds: number[],
  id: number,
) =>
  selectedIds.includes(id)
    ? selectedIds.filter((selectedId) => selectedId !== id)
    : [...selectedIds, id];

export const evaluateSelection = (
  selectedIds: number[],
  targetIds: number[],
) =>
  selectedIds.length === targetIds.length &&
  selectedIds.every((id) => targetIds.includes(id));

export const generateCreatures = (
  count: number,
  random: RandomFn = Math.random,
) => Array.from({ length: count }, (_, index) => createCreature(index + 1, random));

export const generateRound = (
  level: number,
  random: RandomFn = Math.random,
): RoundData => {
  const creatureCount = getCreatureCount(level);
  const difficulty = getCreatureDifficulty(level);
  let creatures = generateCreatures(creatureCount, random);
  let rule = createRuleForDifficulty(difficulty, creatures, random);
  let targetIds = creatures.filter(rule.predicate).map((creature) => creature.id);
  let attempts = 0;

  while (targetIds.length === 0 && attempts < 10) {
    creatures = generateCreatures(creatureCount, random);
    rule = createRuleForDifficulty(difficulty, creatures, random);
    targetIds = creatures.filter(rule.predicate).map((creature) => creature.id);
    attempts += 1;
  }

  if (targetIds.length === 0) {
    rule = createFallbackRule(creatures);
    targetIds = creatures.filter(rule.predicate).map((creature) => creature.id);
  }

  return {
    creatures,
    instruction: rule.instruction,
    targetIds,
    difficulty,
  };
};

export const calculateCreatureLogicScore = (level: number) => 10 * level;
