import { MAX_LEVEL, PRIMES } from "./constants.ts";
import type { NumberSequenceQuestion, PatternType } from "./types.ts";

const shuffleArray = <T>(items: T[], randomFn: () => number) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const getAvailablePatternTypes = (level: number): PatternType[] => {
  if (level <= 3) {
    return ["arithmetic", "geometric"];
  }

  if (level <= 6) {
    return ["arithmetic", "geometric", "square", "fibonacci"];
  }

  if (level <= 10) {
    return [
      "arithmetic",
      "geometric",
      "square",
      "fibonacci",
      "cube",
      "alternating",
    ];
  }

  return [
    "arithmetic",
    "geometric",
    "square",
    "fibonacci",
    "cube",
    "alternating",
    "prime",
    "doubleStep",
  ];
};

export const getSequenceLength = (level: number) => {
  return Math.min(4 + Math.floor(level / 5), 6);
};

const buildOptions = (
  answer: number,
  randomFn: () => number,
) => {
  const options = new Set<number>([answer]);
  let fallbackStep = 0;

  while (options.size < 4) {
    const candidate = answer + (Math.floor(randomFn() * 20) - 10);

    if (candidate !== answer) {
      options.add(candidate);
      continue;
    }

    options.add(answer + 5 + fallbackStep);
    fallbackStep += 1;
  }

  return shuffleArray([...options], randomFn);
};

export const buildQuestionForPattern = (
  patternType: PatternType,
  level: number,
  randomFn: () => number = Math.random,
): NumberSequenceQuestion => {
  const sequenceLength = getSequenceLength(level);
  let answer = 0;
  let patternDescription = "";
  let sequence: number[] = [];

  switch (patternType) {
    case "arithmetic": {
      const start = Math.floor(randomFn() * 10) + 1;
      const difference = Math.floor(randomFn() * (level + 2)) + 1;
      sequence = Array.from(
        { length: sequenceLength },
        (_, index) => start + index * difference,
      );
      answer = start + sequenceLength * difference;
      patternDescription = `+${difference}`;
      break;
    }
    case "geometric": {
      const start = Math.floor(randomFn() * 3) + 1;
      const ratio = level <= 5 ? 2 : Math.floor(randomFn() * 2) + 2;
      sequence = Array.from(
        { length: sequenceLength },
        (_, index) => start * Math.pow(ratio, index),
      );
      answer = start * Math.pow(ratio, sequenceLength);
      patternDescription = `x${ratio}`;
      break;
    }
    case "fibonacci": {
      const first = Math.floor(randomFn() * 3) + 1;
      const second = Math.floor(randomFn() * 3) + 1;
      sequence = [first, second];

      for (let index = 2; index < sequenceLength; index += 1) {
        sequence.push(sequence[index - 1] + sequence[index - 2]);
      }

      answer = sequence[sequenceLength - 1] + sequence[sequenceLength - 2];
      patternDescription = "Toplayarak";
      break;
    }
    case "square": {
      const start = Math.floor(randomFn() * 3) + 1;
      sequence = Array.from(
        { length: sequenceLength },
        (_, index) => Math.pow(start + index, 2),
      );
      answer = Math.pow(start + sequenceLength, 2);
      patternDescription = "Kareler";
      break;
    }
    case "cube": {
      const start = Math.floor(randomFn() * 2) + 1;
      sequence = Array.from(
        { length: sequenceLength },
        (_, index) => Math.pow(start + index, 3),
      );
      answer = Math.pow(start + sequenceLength, 3);
      patternDescription = "Küpler";
      break;
    }
    case "alternating": {
      const start = Math.floor(randomFn() * 10) + 5;
      const positiveStep = Math.floor(randomFn() * 4) + 1;
      const negativeStep = Math.floor(randomFn() * 3) + 1;

      sequence = [start];
      for (let index = 1; index < sequenceLength; index += 1) {
        sequence.push(
          index % 2 === 1
            ? sequence[index - 1] + positiveStep
            : sequence[index - 1] - negativeStep,
        );
      }

      answer =
        sequenceLength % 2 === 1
          ? sequence[sequenceLength - 1] + positiveStep
          : sequence[sequenceLength - 1] - negativeStep;
      patternDescription = `+${positiveStep}/-${negativeStep}`;
      break;
    }
    case "doubleStep": {
      const start = Math.floor(randomFn() * 5) + 1;
      let difference = 2;

      sequence = [start];
      for (let index = 1; index < sequenceLength; index += 1) {
        sequence.push(sequence[index - 1] + difference);
        difference += 1;
      }

      answer = sequence[sequenceLength - 1] + difference;
      patternDescription = "Artan Fark";
      break;
    }
    case "prime": {
      const startIndex = Math.floor(randomFn() * (PRIMES.length - sequenceLength - 1));
      sequence = [...PRIMES.slice(startIndex, startIndex + sequenceLength)];
      answer = PRIMES[startIndex + sequenceLength] ?? PRIMES[PRIMES.length - 1]!;
      patternDescription = "Asallar";
      break;
    }
    default:
      sequence = [];
      answer = 0;
      patternDescription = "";
  }

  return {
    answer,
    options: buildOptions(answer, randomFn),
    patternDescription,
    patternType,
    sequence,
  };
};

export const createQuestionForLevel = (
  level: number,
  randomFn: () => number = Math.random,
) => {
  const availableTypes = getAvailablePatternTypes(level);
  const patternType =
    availableTypes[Math.floor(randomFn() * availableTypes.length)] ?? "arithmetic";

  return buildQuestionForPattern(patternType, level, randomFn);
};

export const getNumberSequenceScore = (level: number) => {
  return 25 + level * 5;
};

export const isMaxLevel = (level: number) => {
  return level >= MAX_LEVEL;
};
