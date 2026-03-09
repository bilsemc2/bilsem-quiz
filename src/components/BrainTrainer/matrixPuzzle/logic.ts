import type {
  BaseShape,
  GameOption,
  MatrixCell,
  MatrixRule,
} from "../../../types/matrixRules.ts";
import type {
  MatrixPuzzleQuestionState,
  QuestionHistoryEntry,
} from "./types.ts";

type RandomFn = () => number;

const randInt = (random: RandomFn, min: number, max: number) =>
  Math.floor(random() * (max - min + 1)) + min;

const shuffle = <T,>(items: T[], random: RandomFn) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randInt(random, 0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const pickHiddenCell = (random: RandomFn = Math.random) => ({
  row: randInt(random, 1, 2),
  col: randInt(random, 1, 2),
});

export const createGridWithHiddenCell = (
  matrix: BaseShape[][],
  hiddenRow: number,
  hiddenCol: number,
): MatrixCell[][] =>
  matrix.map((row, rowIndex) =>
    row.map((shape, colIndex) => ({
      row: rowIndex,
      col: colIndex,
      shape,
      isHidden: rowIndex === hiddenRow && colIndex === hiddenCol,
    })),
  );

export const createOptions = (
  correctShape: BaseShape,
  wrongShapes: BaseShape[],
  random: RandomFn = Math.random,
): GameOption[] =>
  shuffle(
    [
      { id: "correct", shape: correctShape, isCorrect: true },
      ...wrongShapes.map((shape, index) => ({
        id: `wrong-${index}`,
        shape,
        isCorrect: false,
      })),
    ],
    random,
  );

export const createQuestionState = ({
  matrix,
  hiddenRow,
  hiddenCol,
  rule,
  wrongShapes,
  random = Math.random,
}: {
  matrix: BaseShape[][];
  hiddenRow: number;
  hiddenCol: number;
  rule: MatrixRule;
  wrongShapes: BaseShape[];
  random?: RandomFn;
}): MatrixPuzzleQuestionState => {
  const correctAnswer = matrix[hiddenRow][hiddenCol];

  return {
    grid: createGridWithHiddenCell(matrix, hiddenRow, hiddenCol),
    options: createOptions(correctAnswer, wrongShapes, random),
    correctAnswer,
    ruleName: rule.name,
    ruleDescription: rule.description,
  };
};

export const buildQuestionHistoryEntry = ({
  question,
  level,
  selectedAnswer,
  isCorrect,
}: {
  question: MatrixPuzzleQuestionState;
  level: number;
  selectedAnswer: BaseShape;
  isCorrect: boolean;
}): QuestionHistoryEntry => ({
  level,
  ruleName: question.ruleName,
  ruleDescription: question.ruleDescription,
  grid: question.grid.map((row) => row.map((cell) => ({ ...cell }))),
  correctAnswer: question.correctAnswer,
  selectedAnswer,
  isCorrect,
});

export const getMatrixPuzzleScore = (level: number) => level * 10;
