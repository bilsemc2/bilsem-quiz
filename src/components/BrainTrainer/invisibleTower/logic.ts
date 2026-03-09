import { MAX_LEVEL, QUESTION_PHASE_DELAY_MS } from "./constants.ts";
import type { InvisibleTowerRound, TowerSegment } from "./types.ts";

const randomId = (randomFn: () => number) => {
  return Math.floor(randomFn() * 1_000_000_000).toString(36);
};

const shuffleArray = <T>(items: T[], randomFn: () => number) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
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

export const getRowCount = (level: number) => {
  return Math.min(6, 2 + Math.floor(level / 4));
};

export const getFlashDelay = (level: number) => {
  return 1000 - Math.min(600, level * 30);
};

export const getQuestionRevealDelay = () => {
  return QUESTION_PHASE_DELAY_MS;
};

export const getEffectiveSegmentValue = (segment: TowerSegment) => {
  const signedValue = segment.isNegative ? -segment.value : segment.value;
  return signedValue * (segment.multiplier ?? 1);
};

export const createRound = (
  level: number,
  randomFn: () => number = Math.random,
): InvisibleTowerRound => {
  const rowCount = getRowCount(level);
  const tower: TowerSegment[] = [];
  let correctAnswer = 0;

  for (let row = 0; row < rowCount; row += 1) {
    const columnsInRow = rowCount - row;

    for (let col = 0; col < columnsInRow; col += 1) {
      const isNegative = level > 5 && randomFn() < 0.15;
      const multiplier =
        level > 8 && randomFn() < 0.1 ? (randomFn() < 0.7 ? 2 : 3) : undefined;
      const rawValue = Math.floor(randomFn() * 9) + 1;

      const segment: TowerSegment = {
        col,
        id: randomId(randomFn),
        isNegative,
        multiplier,
        row,
        value: rawValue,
      };

      correctAnswer += getEffectiveSegmentValue(segment);
      tower.push(segment);
    }
  }

  return {
    correctAnswer,
    options: buildOptions(correctAnswer, randomFn),
    tower,
  };
};

export const calculateInvisibleTowerScore = (
  level: number,
  streak: number,
) => {
  return 10 * level + streak * 5;
};

export const isMaxLevel = (level: number) => {
  return level >= MAX_LEVEL;
};
