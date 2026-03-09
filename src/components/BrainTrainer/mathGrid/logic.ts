import { MAX_INPUT_LENGTH } from "./constants.ts";
import type {
  ActiveCell,
  CellData,
  GridMatrix,
  Operator,
  PuzzleData,
  PuzzleValidation,
} from "./types.ts";

type RandomFn = () => number;

const GRID_SIZE = 3;

const pickOne = <T,>(items: readonly T[], random: RandomFn = Math.random) =>
  items[Math.floor(random() * items.length)] ?? items[0];

const randomInt = (min: number, max: number, random: RandomFn = Math.random) =>
  Math.floor(random() * (max - min + 1)) + min;

const shuffleItems = <T,>(items: readonly T[], random: RandomFn = Math.random) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const cloneGrid = (grid: GridMatrix) =>
  grid.map((row) => row.map((cell) => ({ ...cell })));

export const getAvailableOperators = (level: number): Operator[] => {
  const availableOps: Operator[] = ["+"];

  if (level >= 3) {
    availableOps.push("-");
  }
  if (level >= 6) {
    availableOps.push("*");
  }
  if (level >= 10) {
    availableOps.push("/");
  }

  return availableOps;
};

export const getRuleDescription = (operator: Operator) => {
  switch (operator) {
    case "+":
      return "A + B = C";
    case "-":
      return "A - B = C";
    case "*":
      return "A x B = C";
    case "/":
      return "A / B = C";
    default:
      return "A + B = C";
  }
};

export const getRowsToHideCount = (level: number) => {
  if (level < 5) {
    return 1;
  }
  if (level < 12) {
    return 2;
  }
  return 3;
};

export const getDifficultyFactor = (level: number) => Math.ceil(level / 3);

export const buildRowValues = (
  operator: Operator,
  difficultyFactor: number,
  random: RandomFn = Math.random,
) => {
  if (operator === "+") {
    const max = 10 + difficultyFactor * 10;
    const a = randomInt(1, max, random);
    const b = randomInt(1, max, random);
    return [a, b, a + b];
  }

  if (operator === "-") {
    const max = 10 + difficultyFactor * 10;
    const b = randomInt(1, max, random);
    const c = randomInt(1, max, random);
    return [b + c, b, c];
  }

  if (operator === "*") {
    const maxFactor = 2 + Math.floor(difficultyFactor / 2);
    const a = randomInt(2, maxFactor, random);
    const b = randomInt(2, maxFactor + 2, random);
    return [a, b, a * b];
  }

  const maxDivisor = 2 + Math.floor(difficultyFactor / 3);
  const maxResult = 5 + difficultyFactor * 2;
  const b = randomInt(2, maxDivisor + 3, random);
  const c = randomInt(2, maxResult, random);
  return [b * c, b, c];
};

export const doesRowMatchOperator = (values: readonly number[], operator: Operator) => {
  const [a, b, c] = values;

  switch (operator) {
    case "+":
      return a + b === c;
    case "-":
      return a - b === c;
    case "*":
      return a * b === c;
    case "/":
      return b !== 0 && a / b === c;
    default:
      return false;
  }
};

export const generatePuzzle = (level: number, random: RandomFn = Math.random): PuzzleData => {
  const operator = pickOne(getAvailableOperators(level), random);
  const difficultyFactor = getDifficultyFactor(level);
  const grid = Array.from({ length: GRID_SIZE }, (_, rowIndex) => {
    const rowValues = buildRowValues(operator, difficultyFactor, random);

    return rowValues.map((value, colIndex) => ({
      col: colIndex,
      isMissing: false,
      row: rowIndex,
      value,
    }));
  });

  const rowsToHide = shuffleItems([0, 1, 2], random).slice(0, getRowsToHideCount(level));
  rowsToHide.forEach((rowIndex) => {
    const colIndex = randomInt(0, GRID_SIZE - 1, random);
    grid[rowIndex][colIndex].isMissing = true;
  });

  return {
    grid,
    operator,
    ruleDescription: getRuleDescription(operator),
  };
};

export const findFirstMissingCell = (grid: GridMatrix): ActiveCell | null => {
  const firstMissingCell = grid.flat().find((cell) => cell.isMissing);
  if (!firstMissingCell) {
    return null;
  }

  return { c: firstMissingCell.col, r: firstMissingCell.row };
};

export const appendDigitToCell = (
  grid: GridMatrix,
  activeCell: ActiveCell | null,
  digit: string,
) => {
  if (!activeCell) {
    return grid;
  }

  const nextGrid = cloneGrid(grid);
  const cell = nextGrid[activeCell.r]?.[activeCell.c];

  if (!cell?.isMissing) {
    return grid;
  }

  const nextValue = `${cell.userValue ?? ""}${digit}`.slice(0, MAX_INPUT_LENGTH);
  cell.userValue = nextValue;

  return nextGrid;
};

export const deleteDigitFromCell = (grid: GridMatrix, activeCell: ActiveCell | null) => {
  if (!activeCell) {
    return grid;
  }

  const nextGrid = cloneGrid(grid);
  const cell = nextGrid[activeCell.r]?.[activeCell.c];

  if (!cell?.isMissing) {
    return grid;
  }

  cell.userValue = cell.userValue?.slice(0, -1) ?? "";
  return nextGrid;
};

export const isCellWrong = (cell: CellData) =>
  cell.isMissing &&
  Boolean(cell.userValue) &&
  Number.parseInt(cell.userValue ?? "", 10) !== cell.value;

export const validatePuzzle = (grid: GridMatrix): PuzzleValidation => {
  let allCorrect = true;
  let anyFilled = false;
  let anyWrong = false;

  grid.forEach((row) => {
    row.forEach((cell) => {
      if (!cell.isMissing) {
        return;
      }

      if (!cell.userValue) {
        allCorrect = false;
        return;
      }

      anyFilled = true;

      if (Number.parseInt(cell.userValue, 10) !== cell.value) {
        allCorrect = false;
        anyWrong = true;
      }
    });
  });

  return {
    allCorrect,
    anyFilled,
    anyWrong,
  };
};

export const calculateMathGridScore = (level: number) => 10 * level;
