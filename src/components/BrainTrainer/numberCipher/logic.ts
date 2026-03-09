import { QUESTION_TYPE_LABELS } from "./constants.ts";
import type { Operator, Question, QuestionType } from "./types.ts";

const OPERATORS: Array<{
  fn: (a: number, b: number) => number;
  op: Operator;
}> = [
  { op: "+", fn: (a, b) => a + b },
  { op: "-", fn: (a, b) => a - b },
  { op: "×", fn: (a, b) => a * b },
];

const PAIR_RELATION_RULES = [
  { name: "Kural: Toplam", fn: (a: number, b: number) => a + b },
  { name: "Kural: Fark", fn: (a: number, b: number) => Math.abs(a - b) },
  { name: "Kural: Çarpım", fn: (a: number, b: number) => a * b },
];

const CONDITIONAL_RULES = [
  {
    name: "Tek→×2, Çift→/2",
    fn: (n: number) => (n % 2 !== 0 ? n * 2 : Math.floor(n / 2)),
  },
  {
    name: "Tek→+3, Çift→-2",
    fn: (n: number) => (n % 2 !== 0 ? n + 3 : n - 2),
  },
  {
    name: "<5→×3, ≥5→+5",
    fn: (n: number) => (n < 5 ? n * 3 : n + 5),
  },
];

const MULTI_RULES = [
  { name: "A² + B", fn: (a: number, b: number) => a * a + b },
  { name: "A × B + A", fn: (a: number, b: number) => a * b + a },
  { name: "(A + B) × 2", fn: (a: number, b: number) => (a + b) * 2 },
];

const pickOne = <T,>(items: readonly T[], random: () => number = Math.random) =>
  items[Math.floor(random() * items.length)] ?? items[0];

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

const randomInt = (
  min: number,
  max: number,
  random: () => number = Math.random,
) => Math.floor(random() * (max - min + 1)) + min;

export const safePair = (
  isSubtraction: boolean,
  random: () => number = Math.random,
): [number, number] => {
  let a = randomInt(1, 9, random);
  let b = randomInt(1, 9, random);

  if (isSubtraction && a < b) {
    [a, b] = [b, a];
  }

  return [a, b];
};

export const createOptions = (
  answer: number,
  random: () => number = Math.random,
) => {
  const options = [answer];
  let safety = 0;

  while (options.length < 4 && safety < 100) {
    const fake = Math.max(0, answer + randomInt(-5, 5, random));
    if (fake !== answer && !options.includes(fake)) {
      options.push(fake);
    }
    safety += 1;
  }

  while (options.length < 4) {
    options.push(answer + options.length * 2);
  }

  return shuffleItems(options, random);
};

export const generateHiddenOperator = (
  random: () => number = Math.random,
): Question => {
  const selected = pickOne(OPERATORS, random);
  const isSubtraction = selected.op === "-";

  const [a, b] = safePair(isSubtraction, random);
  const [c, d] = safePair(isSubtraction, random);
  const [e, f] = safePair(isSubtraction, random);
  const answer = selected.fn(e, f);

  return {
    type: "hidden_operator",
    display: [
      `${a} ? ${b} = ${selected.fn(a, b)}`,
      `${c} ? ${d} = ${selected.fn(c, d)}`,
    ],
    question: `${e} ? ${f} = ?`,
    answer,
    options: createOptions(answer, random),
    explanation: `Kural: ${selected.op}`,
  };
};

export const generatePairRelation = (
  random: () => number = Math.random,
): Question => {
  const selected = pickOne(PAIR_RELATION_RULES, random);
  const pairs = Array.from({ length: 2 }, () => {
    const a = randomInt(2, 7, random);
    const b = randomInt(1, 6, random);
    return { a, b, result: selected.fn(a, b) };
  });
  const questionA = randomInt(2, 8, random);
  const questionB = randomInt(1, 7, random);
  const answer = selected.fn(questionA, questionB);

  return {
    type: "pair_relation",
    display: pairs.map((pair) => `(${pair.a}, ${pair.b}) → ${pair.result}`),
    question: `(${questionA}, ${questionB}) → ?`,
    answer,
    options: createOptions(answer, random),
    explanation: selected.name,
  };
};

export const generateConditional = (
  random: () => number = Math.random,
): Question => {
  const selected = pickOne(CONDITIONAL_RULES, random);
  const examples = shuffleItems([2, 3, 5, 8], random)
    .slice(0, 3)
    .map((value) => ({
      input: value,
      output: selected.fn(value),
    }));
  const questionNumber = pickOne(shuffleItems([1, 4, 6, 7, 9], random), random);
  const answer = selected.fn(questionNumber);

  return {
    type: "conditional",
    display: examples.map((example) => `${example.input} → ${example.output}`),
    question: `${questionNumber} → ?`,
    answer,
    options: createOptions(answer, random),
    explanation: `Kural: ${selected.name}`,
  };
};

export const generateMultiRule = (
  random: () => number = Math.random,
): Question => {
  const selected = pickOne(MULTI_RULES, random);
  const examples = Array.from({ length: 2 }, () => {
    const a = randomInt(2, 5, random);
    const b = randomInt(1, 4, random);
    return { a, b, result: selected.fn(a, b) };
  });
  const questionA = randomInt(2, 6, random);
  const questionB = randomInt(1, 5, random);
  const answer = selected.fn(questionA, questionB);

  return {
    type: "multi_rule",
    display: examples.map(
      (example) => `A=${example.a}, B=${example.b} → ${example.result}`,
    ),
    question: `A=${questionA}, B=${questionB} → ?`,
    answer,
    options: createOptions(answer, random),
    explanation: `Kural: ${selected.name}`,
  };
};

export const createQuestionForLevel = (
  level: number,
  random: () => number = Math.random,
): Question => {
  if (level <= 5) {
    return generateHiddenOperator(random);
  }

  if (level <= 10) {
    return generatePairRelation(random);
  }

  if (level <= 15) {
    return generateConditional(random);
  }

  return generateMultiRule(random);
};

export const getQuestionTypeLabel = (type: QuestionType) =>
  QUESTION_TYPE_LABELS[type] ?? "Gizemli Şifre";

export const getNumberCipherScore = (level: number) => 10 * level;
