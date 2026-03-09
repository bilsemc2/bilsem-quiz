import {
  GRID_SIZE,
  MAX_LEVEL,
} from "./constants.ts";
import type {
  MatrixEchoCell,
  MatrixEchoQuestion,
  MatrixEchoQuestionKind,
} from "./types.ts";

const shuffleArray = <T>(items: T[], randomFn: () => number) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const pickRandomItem = <T>(items: T[], randomFn: () => number) => {
  return items[Math.floor(randomFn() * items.length)];
};

const getPositionLabel = (index: number) => `${index + 1}. kutu`;

export const getCellCount = (level: number) => {
  return Math.min(7, 3 + Math.floor((level - 1) / 3));
};

export const getMaxNumber = (level: number) => {
  return Math.min(30, 9 + level * 2);
};

export const getMemorizeTime = (level: number) => {
  return Math.max(1500, 4000 - (level - 1) * 150);
};

export const getAvailableQuestionKinds = (
  level: number,
  cellCount: number,
): MatrixEchoQuestionKind[] => {
  const questionKinds: MatrixEchoQuestionKind[] = [
    "value-by-position",
    "position-by-value",
    "max-position",
    "min-position",
  ];

  if (level >= 5 && cellCount >= 2) {
    questionKinds.push("sum-by-position");
  }

  if (level >= 10 && cellCount >= 2) {
    questionKinds.push("difference-by-position");
  }

  return questionKinds;
};

export const generateCells = (
  level: number,
  randomFn: () => number = Math.random,
): MatrixEchoCell[] => {
  const cellCount = getCellCount(level);
  const maxNumber = getMaxNumber(level);
  const usedValues = new Set<number>();
  const shuffledIndices = shuffleArray(
    Array.from({ length: GRID_SIZE }, (_, index) => index),
    randomFn,
  );

  return shuffledIndices.slice(0, cellCount).map((gridIndex) => {
    let value = 0;

    do {
      value = Math.floor(randomFn() * maxNumber) + 1;
    } while (usedValues.has(value));

    usedValues.add(value);
    return { gridIndex, value };
  });
};

const createQuestionPayload = (
  kind: MatrixEchoQuestionKind,
  cells: MatrixEchoCell[],
  randomFn: () => number,
) => {
  switch (kind) {
    case "value-by-position": {
      const cell = pickRandomItem(cells, randomFn);
      return {
        text: `${getPositionLabel(cell.gridIndex)}'da hangi sayı var?`,
        answer: cell.value,
      };
    }
    case "position-by-value": {
      const cell = pickRandomItem(cells, randomFn);
      return {
        text: `${cell.value} sayısı kaçıncı kutuda?`,
        answer: cell.gridIndex + 1,
      };
    }
    case "max-position": {
      const maxCell = [...cells].sort((left, right) => right.value - left.value)[0];
      return {
        text: "En büyük sayı kaçıncı kutuda?",
        answer: (maxCell?.gridIndex ?? 0) + 1,
      };
    }
    case "min-position": {
      const minCell = [...cells].sort((left, right) => left.value - right.value)[0];
      return {
        text: "En küçük sayı kaçıncı kutuda?",
        answer: (minCell?.gridIndex ?? 0) + 1,
      };
    }
    case "sum-by-position": {
      const [firstCell, secondCell] = shuffleArray([...cells], randomFn).slice(0, 2);
      return {
        text: `${getPositionLabel(firstCell!.gridIndex)} + ${getPositionLabel(secondCell!.gridIndex)} toplamı?`,
        answer: firstCell!.value + secondCell!.value,
      };
    }
    case "difference-by-position": {
      const [firstCell, secondCell] = shuffleArray([...cells], randomFn).slice(0, 2);
      const biggerValue = Math.max(firstCell!.value, secondCell!.value);
      const smallerValue = Math.min(firstCell!.value, secondCell!.value);

      return {
        text: `${getPositionLabel(firstCell!.gridIndex)} ile ${getPositionLabel(secondCell!.gridIndex)} farkı?`,
        answer: biggerValue - smallerValue,
      };
    }
    default:
      return {
        text: "",
        answer: 0,
      };
  }
};

export const createQuestion = (
  cells: MatrixEchoCell[],
  level: number,
  randomFn: () => number = Math.random,
): MatrixEchoQuestion => {
  const questionKinds = getAvailableQuestionKinds(level, cells.length);
  const selectedKind = pickRandomItem(questionKinds, randomFn);
  const question = createQuestionPayload(selectedKind, cells, randomFn);
  const options = new Set<number>([question.answer]);
  let fallbackOffset = 1;

  while (options.size < 4) {
    const offset = Math.floor(randomFn() * 8) - 4;
    const candidate = question.answer + (offset === 0 ? 1 : offset);

    if (candidate > 0) {
      options.add(candidate);
      continue;
    }

    options.add(question.answer + fallbackOffset);
    fallbackOffset += 1;
  }

  return {
    ...question,
    options: shuffleArray([...options], randomFn),
  };
};

export const calculateMatrixEchoScore = (level: number) => {
  return 10 * level;
};

export const isMaxLevel = (level: number) => {
  return level >= MAX_LEVEL;
};
