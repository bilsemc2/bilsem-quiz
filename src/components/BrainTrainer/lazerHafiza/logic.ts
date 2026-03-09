import type { Coordinate, LevelConfig } from "./types.ts";

type RandomFn = () => number;

const CARDINAL_MOVES = [
  { rowDelta: -1, colDelta: 0 },
  { rowDelta: 1, colDelta: 0 },
  { rowDelta: 0, colDelta: -1 },
  { rowDelta: 0, colDelta: 1 },
];

const DIAGONAL_MOVES = [
  { rowDelta: -1, colDelta: -1 },
  { rowDelta: -1, colDelta: 1 },
  { rowDelta: 1, colDelta: -1 },
  { rowDelta: 1, colDelta: 1 },
];

export const getLevelConfig = (level: number): LevelConfig => ({
  gridSize: Math.min(6, 3 + Math.floor((level - 1) / 2)),
  pathLength: Math.min(
    Math.min(6, 3 + Math.floor((level - 1) / 2)) ** 2 - 1,
    3 + Math.floor((level - 1) * 0.8),
  ),
  allowDiagonals: level >= 3,
});

export const getPreviewSpeed = (level: number) => {
  return Math.max(350, 700 - level * 20);
};

export const calculateLazerHafizaScore = (level: number, pathLength: number) => {
  return level * 100 + pathLength * 10;
};

export const buildSvgPath = (coordinates: Coordinate[], gridSize: number) => {
  if (coordinates.length < 2) {
    return "";
  }

  const cellSize = 100 / gridSize;

  return coordinates
    .map((coordinate, index) => {
      const x = coordinate.col * cellSize + cellSize / 2;
      const y = coordinate.row * cellSize + cellSize / 2;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
};

const isSameCoordinate = (left: Coordinate, right: Coordinate) => {
  return left.row === right.row && left.col === right.col;
};

export const generateRandomPath = (
  size: number,
  length: number,
  allowDiagonals: boolean,
  random: RandomFn = Math.random,
): Coordinate[] => {
  let targetLength = length;
  const minLength = 2;
  const moves = allowDiagonals
    ? [...CARDINAL_MOVES, ...DIAGONAL_MOVES]
    : CARDINAL_MOVES;

  while (targetLength >= minLength) {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const path: Coordinate[] = [];
      let currentRow = Math.floor(random() * size);
      let currentCol = Math.floor(random() * size);
      path.push({ row: currentRow, col: currentCol });

      let stuck = false;

      for (let index = 1; index < targetLength; index += 1) {
        const validMoves = moves.filter(({ rowDelta, colDelta }) => {
          const nextRow = currentRow + rowDelta;
          const nextCol = currentCol + colDelta;

          if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) {
            return false;
          }

          return !path.some((coordinate) =>
            isSameCoordinate(coordinate, { row: nextRow, col: nextCol }),
          );
        });

        if (validMoves.length === 0) {
          stuck = true;
          break;
        }

        const move = validMoves[Math.floor(random() * validMoves.length)];
        currentRow += move.rowDelta;
        currentCol += move.colDelta;
        path.push({ row: currentRow, col: currentCol });
      }

      if (!stuck && path.length === targetLength) {
        return path;
      }
    }

    targetLength -= 1;
  }

  return [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ];
};
