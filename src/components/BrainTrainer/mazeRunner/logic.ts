import {
  CANVAS_HORIZONTAL_PADDING,
  CANVAS_VERTICAL_OFFSET,
  MAX_CANVAS_WIDTH,
  MIN_CANVAS_SIZE,
  MIN_PATH_POINT_DISTANCE,
  START_PADDING,
} from "./constants.ts";
import type { MazeCell, MazeLevelData, PathPoint, WallSeed } from "./types.ts";

type RandomFn = () => number;

const rand = (min: number, max: number, random: RandomFn = Math.random) => {
  return random() * (max - min) + min;
};

export const getLevelDimensions = (level: number) => {
  const base = 4;

  return {
    cols: base + Math.min(level, 8) + Math.floor(level / 2),
    rows: base + Math.min(level, 8) + Math.floor(level * 0.3),
  };
};

export const generateMaze = (
  cols: number,
  rows: number,
  random: RandomFn = Math.random,
): MazeCell[][] => {
  const grid: MazeCell[][] = [];

  for (let row = 0; row < rows; row += 1) {
    const currentRow: MazeCell[] = [];

    for (let column = 0; column < cols; column += 1) {
      currentRow.push({
        x: column,
        y: row,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      });
    }

    grid.push(currentRow);
  }

  const stack: MazeCell[] = [grid[0][0]];
  grid[0][0].visited = true;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: MazeCell[] = [];

    if (current.y > 0 && !grid[current.y - 1][current.x].visited) neighbors.push(grid[current.y - 1][current.x]);
    if (current.x < cols - 1 && !grid[current.y][current.x + 1].visited) neighbors.push(grid[current.y][current.x + 1]);
    if (current.y < rows - 1 && !grid[current.y + 1][current.x].visited) neighbors.push(grid[current.y + 1][current.x]);
    if (current.x > 0 && !grid[current.y][current.x - 1].visited) neighbors.push(grid[current.y][current.x - 1]);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const next = neighbors[Math.floor(random() * neighbors.length)];
    const dx = current.x - next.x;
    const dy = current.y - next.y;

    if (dx === 1) {
      current.walls.left = false;
      next.walls.right = false;
    } else if (dx === -1) {
      current.walls.right = false;
      next.walls.left = false;
    }

    if (dy === 1) {
      current.walls.top = false;
      next.walls.bottom = false;
    } else if (dy === -1) {
      current.walls.bottom = false;
      next.walls.top = false;
    }

    next.visited = true;
    stack.push(next);
  }

  grid.forEach((row) => row.forEach((cell) => {
    cell.visited = false;
  }));

  return grid;
};

export const solveMaze = (maze: MazeCell[][]): Set<string> => {
  const rows = maze.length;
  const cols = maze[0]?.length ?? 0;
  const queue: Array<{ cell: MazeCell; path: string[] }> = [
    { cell: maze[0][0], path: ["0,0"] },
  ];
  const visited = new Set<string>(["0,0"]);

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      break;
    }

    const { cell, path } = current;

    if (cell.x === cols - 1 && cell.y === rows - 1) {
      return new Set(path);
    }

    const adjacent: MazeCell[] = [];

    if (!cell.walls.top && cell.y > 0) adjacent.push(maze[cell.y - 1][cell.x]);
    if (!cell.walls.right && cell.x < cols - 1) adjacent.push(maze[cell.y][cell.x + 1]);
    if (!cell.walls.bottom && cell.y < rows - 1) adjacent.push(maze[cell.y + 1][cell.x]);
    if (!cell.walls.left && cell.x > 0) adjacent.push(maze[cell.y][cell.x - 1]);

    adjacent.forEach((neighbor) => {
      const key = `${neighbor.x},${neighbor.y}`;

      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ cell: neighbor, path: [...path, key] });
      }
    });
  }

  return new Set();
};

export const createWallSeeds = (
  maze: MazeCell[][],
  level: number,
  random: RandomFn = Math.random,
): WallSeed[] => {
  const maxThick = 2 + Math.min(level * 2.5, 25);
  const seeds: WallSeed[] = [];

  maze.forEach((row) => row.forEach(() => {
    seeds.push({
      top: { midOffset: rand(-5, 5, random), thick: rand(2, maxThick, random) },
      right: { midOffset: rand(-5, 5, random), thick: rand(2, maxThick, random) },
      bottom: { midOffset: rand(-5, 5, random), thick: rand(2, maxThick, random) },
      left: { midOffset: rand(-5, 5, random), thick: rand(2, maxThick, random) },
    });
  }));

  return seeds;
};

export const createMazeLevel = (
  level: number,
  random: RandomFn = Math.random,
): MazeLevelData => {
  const { cols, rows } = getLevelDimensions(level);
  const maze = generateMaze(cols, rows, random);

  return {
    maze,
    solutionSet: solveMaze(maze),
    cols,
    rows,
    wallSeeds: createWallSeeds(maze, level, random),
  };
};

export const calculateCanvasSize = (
  viewportWidth: number,
  viewportHeight: number,
): number => {
  const maxWidth = Math.min(viewportWidth - CANVAS_HORIZONTAL_PADDING, MAX_CANVAS_WIDTH);
  const maxHeight = viewportHeight - CANVAS_VERTICAL_OFFSET;

  return Math.max(MIN_CANVAS_SIZE, Math.min(maxWidth, maxHeight));
};

export const isStartZone = (x: number, y: number, cellSize: number): boolean => {
  return x < cellSize && y < cellSize;
};

export const getLogicalCellKey = (x: number, y: number, cellSize: number): string => {
  return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
};

export const isExitReached = (
  x: number,
  y: number,
  cols: number,
  rows: number,
  cellSize: number,
): boolean => {
  const endX = (cols - 1) * cellSize;
  const endY = (rows - 1) * cellSize;

  return x > endX + START_PADDING && y > endY + START_PADDING;
};

export const shouldAppendPoint = (
  path: PathPoint[],
  x: number,
  y: number,
  minDistance: number = MIN_PATH_POINT_DISTANCE,
): boolean => {
  if (path.length === 0) {
    return false;
  }

  const lastPoint = path[path.length - 1];
  return Math.hypot(x - lastPoint.x, y - lastPoint.y) > minDistance;
};
