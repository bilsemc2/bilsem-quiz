import { COLOR_OPTIONS, SHAPE_DEFINITIONS } from "./constants.ts";
import type {
  QuestionData,
  QuestionType,
  ShapeColorAssignment,
  ShapeDefinition,
} from "./types.ts";

const shuffleItems = <T>(items: readonly T[], random = Math.random): T[] => {
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

export const getSymbolCount = (level: number) => {
  if (level <= 6) {
    return 4;
  }

  if (level <= 13) {
    return 5;
  }

  return 6;
};

export const getMemorizeTime = (level: number) => {
  if (level <= 5) {
    return 5;
  }

  if (level <= 10) {
    return 4;
  }

  if (level <= 15) {
    return 3;
  }

  return 2;
};

export const generateSymbolColors = (
  level: number,
  random = Math.random,
): ShapeColorAssignment[] => {
  const count = getSymbolCount(level);
  const shapes = shuffleItems<ShapeDefinition>(SHAPE_DEFINITIONS, random).slice(
    0,
    count,
  );
  const colors = shuffleItems(COLOR_OPTIONS, random).slice(0, count);

  return shapes.map((shape, index) => ({
    key: shape.key,
    shapeName: shape.name,
    fill: shape.fill,
    color: colors[index].hex,
    colorName: colors[index].name,
  }));
};

export const generateQuestion = (
  pairs: ShapeColorAssignment[],
  random = Math.random,
): QuestionData => {
  if (pairs.length === 0) {
    throw new Error("generateQuestion requires at least one shape/color pair");
  }

  const questionType: QuestionType = random() > 0.5 ? "symbol" : "color";
  const target = pairs[Math.floor(random() * pairs.length)] ?? pairs[0];
  const otherPairs = pairs.filter((pair) => pair.shapeName !== target.shapeName);

  if (questionType === "color") {
    const correctAnswer = target.shapeName;
    const wrongOptions = otherPairs.map((pair) => pair.shapeName).slice(0, 3);

    return {
      type: "color",
      query: `${target.colorName} renkteki şekil hangisiydi?`,
      correctAnswer,
      options: shuffleItems([correctAnswer, ...wrongOptions], random),
    };
  }

  const correctAnswer = target.colorName;
  const wrongOptions = otherPairs.map((pair) => pair.colorName).slice(0, 3);

  return {
    type: "symbol",
    query: `${target.shapeName} hangi renkteydi?`,
    correctAnswer,
    options: shuffleItems([correctAnswer, ...wrongOptions], random),
    targetShapeName: target.shapeName,
  };
};

export const getSymbolMatchScore = (level: number, streak: number) => {
  return 100 + level * 10 + streak * 15;
};

export const isCorrectAnswer = (question: QuestionData, answer: string) => {
  return question.correctAnswer === answer;
};
