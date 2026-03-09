import {
  COLORS,
  MAX_ANSWER_LENGTH,
  SHAPES,
} from "./constants.ts";
import type {
  EquationDef,
  EquationTerm,
  LevelData,
  VariableDef,
} from "./types.ts";

const randInt = (random: () => number, min: number, max: number) =>
  Math.floor(random() * (max - min + 1)) + min;

const pick = <T,>(items: T[], random: () => number): T =>
  items[Math.floor(random() * items.length)];

const shuffle = <T,>(items: T[], random: () => number): T[] => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randInt(random, 0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const getVariableCountForLevel = (level: number) =>
  Math.min(3 + Math.floor(level / 5), 5);

export const getTermsPerEquationForLevel = (level: number) =>
  Math.min(2 + Math.floor(level / 8), 4);

export const getMaxValueForLevel = (level: number) =>
  Math.min(10 + level * 2, 50);

export const getQuestionTermCountForLevel = (level: number) =>
  getTermsPerEquationForLevel(level) + (level > 15 ? 1 : 0);

const createVariables = (
  level: number,
  random: () => number,
): VariableDef[] => {
  const variableCount = getVariableCountForLevel(level);
  const maxValue = getMaxValueForLevel(level);
  const availableColors = shuffle(COLORS, random);
  const availableShapes = shuffle(SHAPES, random);

  return Array.from({ length: variableCount }, (_, index) => ({
    id: `v${index}`,
    shape: availableShapes[index % availableShapes.length],
    color: availableColors[index % availableColors.length],
    dotted: level > 10 && random() > 0.5,
    value: randInt(random, 1, maxValue),
  }));
};

const createEquations = (
  variables: VariableDef[],
  level: number,
  random: () => number,
): { equations: EquationDef[]; referencedVarIds: Set<string> } => {
  const termsPerEquation = getTermsPerEquationForLevel(level);
  const referencedVarIds = new Set<string>();
  const equations: EquationDef[] = [];
  const solvableVariables = variables.slice(
    0,
    Math.max(1, variables.length - 1),
  );
  const anchor = solvableVariables[0];

  equations.push({
    id: "e0",
    items: [{ variableId: anchor.id }],
    result: anchor.value,
  });
  referencedVarIds.add(anchor.id);

  for (let index = 1; index < solvableVariables.length; index += 1) {
    const target = solvableVariables[index];
    const knownVariables = solvableVariables.slice(0, index);
    const supportCount = Math.min(termsPerEquation - 1, knownVariables.length);
    const items: EquationTerm[] = [{ variableId: target.id }];
    let sum = target.value;

    for (let supportIndex = 0; supportIndex < supportCount; supportIndex += 1) {
      const support = pick(knownVariables, random);
      items.push({ variableId: support.id });
      sum += support.value;
      referencedVarIds.add(support.id);
    }

    referencedVarIds.add(target.id);
    equations.push({
      id: `e${index}`,
      items,
      result: sum,
    });
  }

  return { equations, referencedVarIds };
};

const createQuestion = (
  variables: VariableDef[],
  referencedVarIds: Set<string>,
  level: number,
  random: () => number,
) => {
  const questionPool = variables.filter((variable) =>
    referencedVarIds.has(variable.id),
  );
  const sourcePool = questionPool.length > 0 ? questionPool : variables;
  const termCount = getQuestionTermCountForLevel(level);
  const items: EquationTerm[] = [];
  let answer = 0;

  for (let index = 0; index < termCount; index += 1) {
    const variable = pick(sourcePool, random);
    items.push({ variableId: variable.id });
    answer += variable.value;
  }

  return {
    items,
    answer,
    text: "Sonuç?",
  };
};

export const createLevelData = (
  level: number,
  random: () => number = Math.random,
): LevelData => {
  const variables = createVariables(level, random);
  const { equations, referencedVarIds } = createEquations(
    variables,
    level,
    random,
  );

  return {
    variables,
    equations,
    question: createQuestion(variables, referencedVarIds, level, random),
  };
};

export const appendAnswerDigit = (
  currentValue: string,
  digit: string,
  maxLength = MAX_ANSWER_LENGTH,
) => {
  if (currentValue.length >= maxLength) {
    return currentValue;
  }

  return `${currentValue}${digit}`;
};

export const deleteAnswerDigit = (currentValue: string) =>
  currentValue.slice(0, -1);

export const isCorrectAnswer = (expectedAnswer: number, userAnswer: string) =>
  expectedAnswer === Number.parseInt(userAnswer, 10);

export const getLevelScore = (level: number) => level * 10;
