import type { Question, QuestionType } from "./types.ts";

type RandomFn = () => number;

const pickOne = <T,>(items: readonly T[], random: RandomFn = Math.random) =>
  items[Math.floor(random() * items.length)] ?? items[0];

export const shuffleItems = <T,>(
  items: readonly T[],
  random: RandomFn = Math.random,
) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const randomInt = (min: number, max: number, random: RandomFn = Math.random) =>
  Math.floor(random() * (max - min + 1)) + min;

export const getSequenceLength = (level: number) =>
  Math.min(3 + Math.floor(level / 4), 7);

export const generateSequence = (
  level: number,
  random: RandomFn = Math.random,
) =>
  Array.from({ length: getSequenceLength(level) }, () => randomInt(0, 9, random));

export const pickQuestionType = (
  level: number,
  random: RandomFn = Math.random,
): QuestionType => {
  if (level <= 3) {
    return "number";
  }

  return pickOne(["number", "order", "sum", "max"], random);
};

const createUniqueOptions = (
  answer: number,
  maxValue: number,
  random: RandomFn = Math.random,
) => {
  const options = [answer];

  while (options.length < 4) {
    const candidate = randomInt(0, maxValue, random);
    if (!options.includes(candidate)) {
      options.push(candidate);
    }
  }

  return shuffleItems(options, random);
};

export const createNumberQuestion = (
  sequence: number[],
  random: RandomFn = Math.random,
): Question => {
  const answer = pickOne(sequence, random);
  const inSequence = new Set(sequence);
  const distractors = shuffleItems(
    Array.from({ length: 10 }, (_, value) => value).filter(
      (value) => !inSequence.has(value),
    ),
    random,
  ).slice(0, 3);

  const options = [...distractors, answer];
  while (options.length < 4) {
    const candidate = randomInt(0, 9, random);
    if (!options.includes(candidate)) {
      options.push(candidate);
    }
  }

  return {
    answer,
    options: shuffleItems(options, random),
    text: "Duyduğun rakamlardan hangisi dizide vardı?",
    type: "number",
  };
};

export const createOrderQuestion = (
  sequence: number[],
  random: RandomFn = Math.random,
): Question => {
  const index = randomInt(0, sequence.length - 1, random);
  const answer = sequence[index];

  return {
    answer,
    options: createUniqueOptions(answer, 9, random),
    text: `${index + 1}. sırada hangi rakamı duydun?`,
    type: "order",
  };
};

export const createSumQuestion = (
  sequence: number[],
  random: RandomFn = Math.random,
): Question => {
  let firstIndex = randomInt(0, sequence.length - 1, random);
  let secondIndex = randomInt(0, sequence.length - 1, random);

  while (firstIndex === secondIndex) {
    secondIndex = randomInt(0, sequence.length - 1, random);
  }

  if (firstIndex > secondIndex) {
    [firstIndex, secondIndex] = [secondIndex, firstIndex];
  }

  const answer = sequence[firstIndex] + sequence[secondIndex];

  return {
    answer,
    options: createUniqueOptions(answer, 19, random),
    text: `Duyduğun ${firstIndex + 1}. ve ${secondIndex + 1}. sıradaki rakamların toplamı kaçtır?`,
    type: "sum",
  };
};

export const createMaxQuestion = (
  sequence: number[],
  random: RandomFn = Math.random,
): Question => {
  const answer = Math.max(...sequence);

  return {
    answer,
    options: createUniqueOptions(answer, 9, random),
    text: "Duyduğunuz en büyük rakam hangisiydi?",
    type: "max",
  };
};

export const createQuestion = (
  sequence: number[],
  level: number,
  random: RandomFn = Math.random,
): Question => {
  switch (pickQuestionType(level, random)) {
    case "order":
      return createOrderQuestion(sequence, random);
    case "sum":
      return createSumQuestion(sequence, random);
    case "max":
      return createMaxQuestion(sequence, random);
    case "number":
    default:
      return createNumberQuestion(sequence, random);
  }
};

export const calculateNumberMemoryScore = (level: number) => 30 + level * 5;
