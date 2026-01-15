
import { Cell, AlgorithmType } from '../types';

export const createEmptyGrid = (rows: number, cols: number): Cell[][] => {
  const grid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      });
    }
    grid.push(row);
  }
  return grid;
};

const setupEntryExit = (grid: Cell[][]) => {
  const rows = grid.length;
  const cols = grid[0].length;
  grid[0][0].isEntry = true;
  grid[0][0].walls.left = false;
  grid[rows - 1][cols - 1].isExit = true;
  grid[rows - 1][cols - 1].walls.right = false;
};

const removeWalls = (a: Cell, b: Cell) => {
  const x = a.col - b.col;
  if (x === 1) { a.walls.left = false; b.walls.right = false; } 
  else if (x === -1) { a.walls.right = false; b.walls.left = false; }
  const y = a.row - b.row;
  if (y === 1) { a.walls.top = false; b.walls.bottom = false; } 
  else if (y === -1) { a.walls.bottom = false; b.walls.top = false; }
};

const getUnvisitedNeighbors = (cell: Cell, grid: Cell[][]): Cell[] => {
  const { row, col } = cell;
  const neighbors: Cell[] = [];
  if (row > 0 && !grid[row - 1][col].visited) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1 && !grid[row + 1][col].visited) neighbors.push(grid[row + 1][col]);
  if (col > 0 && !grid[row][col - 1].visited) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1 && !grid[row][col + 1].visited) neighbors.push(grid[row][col + 1]);
  return neighbors;
};

const getVisitedNeighbors = (cell: Cell, grid: Cell[][]): Cell[] => {
  const { row, col } = cell;
  const neighbors: Cell[] = [];
  if (row > 0 && grid[row - 1][col].visited) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1 && grid[row + 1][col].visited) neighbors.push(grid[row + 1][col]);
  if (col > 0 && grid[row][col - 1].visited) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1 && grid[row][col + 1].visited) neighbors.push(grid[row][col + 1]);
  return neighbors;
};

export function* generateDFSMaze(grid: Cell[][]) {
  const stack: Cell[] = [];
  const startCell = grid[0][0];
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, grid);
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWalls(current, next);
      next.visited = true;
      stack.push(next);
      yield [...grid.map(r => [...r])];
    } else {
      stack.pop();
      yield [...grid.map(r => [...r])];
    }
  }
  setupEntryExit(grid);
}

export function* generatePrimsMaze(grid: Cell[][]) {
  const walls: { c1: Cell, c2: Cell }[] = [];
  const rows = grid.length;
  const cols = grid[0].length;
  const startCell = grid[Math.floor(Math.random() * rows)][Math.floor(Math.random() * cols)];
  startCell.visited = true;
  
  const addNeighborsToWallList = (cell: Cell) => {
    const { row, col } = cell;
    if (row > 0) walls.push({ c1: cell, c2: grid[row - 1][col] });
    if (row < rows - 1) walls.push({ c1: cell, c2: grid[row + 1][col] });
    if (col > 0) walls.push({ c1: cell, c2: grid[row][col - 1] });
    if (col < cols - 1) walls.push({ c1: cell, c2: grid[row][col + 1] });
  };

  addNeighborsToWallList(startCell);

  while (walls.length > 0) {
    const randomIndex = Math.floor(Math.random() * walls.length);
    const { c1, c2 } = walls[randomIndex];
    walls.splice(randomIndex, 1);

    if (c1.visited !== c2.visited) {
      const unvisited = c1.visited ? c2 : c1;
      const visited = c1.visited ? c1 : c2;
      removeWalls(visited, unvisited);
      unvisited.visited = true;
      addNeighborsToWallList(unvisited);
      yield [...grid.map(r => [...r])];
    }
  }
  setupEntryExit(grid);
}

export function* generateHuntAndKill(grid: Cell[][]) {
  let current: Cell | null = grid[0][0];
  current.visited = true;
  const rows = grid.length;
  const cols = grid[0].length;

  while (current) {
    const neighbors = getUnvisitedNeighbors(current, grid);
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWalls(current, next);
      next.visited = true;
      current = next;
      yield [...grid.map(r => [...r])];
    } else {
      current = null;
      outer: for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (!cell.visited) {
            const visitedNeighbors = getVisitedNeighbors(cell, grid);
            if (visitedNeighbors.length > 0) {
              const next = visitedNeighbors[Math.floor(Math.random() * visitedNeighbors.length)];
              removeWalls(cell, next);
              cell.visited = true;
              current = cell;
              yield [...grid.map(r => [...r])];
              break outer;
            }
          }
        }
      }
    }
  }
  setupEntryExit(grid);
}

export function* generateBinaryTree(grid: Cell[][]) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      cell.visited = true;
      const choices = [];
      if (r > 0) choices.push(grid[r - 1][c]);
      if (c > 0) choices.push(grid[r][c - 1]);
      if (choices.length > 0) {
        const neighbor = choices[Math.floor(Math.random() * choices.length)];
        removeWalls(cell, neighbor);
      }
      yield [...grid.map(r => [...r])];
    }
  }
  setupEntryExit(grid);
}

export function* generateSidewinder(grid: Cell[][]) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let r = 0; r < rows; r++) {
    let run: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      cell.visited = true;
      run.push(cell);
      const atEasternBoundary = (c === cols - 1);
      const atNorthernBoundary = (r === 0);
      const shouldCloseOut = atEasternBoundary || (!atNorthernBoundary && Math.random() > 0.5);

      if (shouldCloseOut) {
        const member = run[Math.floor(Math.random() * run.length)];
        if (member.row > 0) {
          const neighbor = grid[member.row - 1][member.col];
          removeWalls(member, neighbor);
        }
        run = [];
      } else {
        const neighbor = grid[r][c + 1];
        removeWalls(cell, neighbor);
      }
      yield [...grid.map(r => [...r])];
    }
  }
  setupEntryExit(grid);
}

export function* generateAldousBroder(grid: Cell[][]) {
  const rows = grid.length;
  const cols = grid[0].length;
  let unvisitedCount = rows * cols - 1;
  let current = grid[Math.floor(Math.random() * rows)][Math.floor(Math.random() * cols)];
  current.visited = true;

  while (unvisitedCount > 0) {
    const { row, col } = current;
    const neighbors = [];
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < rows - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < cols - 1) neighbors.push(grid[row][col + 1]);

    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    if (!next.visited) {
      removeWalls(current, next);
      next.visited = true;
      unvisitedCount--;
    }
    current = next;
    yield [...grid.map(r => [...r])];
  }
  setupEntryExit(grid);
}

export function* generateWilsons(grid: Cell[][]) {
  const rows = grid.length;
  const cols = grid[0].length;
  const unvisited: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      unvisited.push(grid[r][c]);
    }
  }

  const first = unvisited.splice(Math.floor(Math.random() * unvisited.length), 1)[0];
  first.visited = true;

  while (unvisited.length > 0) {
    let cell = unvisited[Math.floor(Math.random() * unvisited.length)];
    const path = [cell];
    while (!cell.visited) {
      const { row, col } = cell;
      const neighbors = [];
      if (row > 0) neighbors.push(grid[row - 1][col]);
      if (row < rows - 1) neighbors.push(grid[row + 1][col]);
      if (col > 0) neighbors.push(grid[row][col - 1]);
      if (col < cols - 1) neighbors.push(grid[row][col + 1]);
      
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      const index = path.indexOf(next);
      if (index !== -1) {
        path.splice(index + 1);
      } else {
        path.push(next);
      }
      cell = next;
    }

    for (let i = 0; i < path.length - 1; i++) {
      const c1 = path[i];
      const c2 = path[i+1];
      removeWalls(c1, c2);
      c1.visited = true;
      unvisited.splice(unvisited.indexOf(c1), 1);
      yield [...grid.map(r => [...r])];
    }
  }
  setupEntryExit(grid);
}

export function* generateRecursiveDivision(grid: Cell[][]) {
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Start by removing all internal walls
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      cell.visited = true;
      cell.walls = { top: false, right: false, bottom: false, left: false };
      // Keep outer boundaries
      if (r === 0) cell.walls.top = true;
      if (r === rows - 1) cell.walls.bottom = true;
      if (c === 0) cell.walls.left = true;
      if (c === cols - 1) cell.walls.right = true;
    }
  }

  function* divide(r1: number, c1: number, r2: number, c2: number): Generator<Cell[][]> {
    const width = c2 - c1;
    const height = r2 - r1;
    if (width < 1 || height < 1) return;

    const horizontal = (width < height);
    if (horizontal) {
      // Horizontal wall
      const wallR = r1 + Math.floor(Math.random() * height);
      const passC = c1 + Math.floor(Math.random() * (width + 1));
      for (let c = c1; c <= c2; c++) {
        if (c !== passC) {
          grid[wallR][c].walls.bottom = true;
          grid[wallR + 1][c].walls.top = true;
        }
      }
      yield [...grid.map(r => [...r])];
      yield* divide(r1, c1, wallR, c2);
      yield* divide(wallR + 1, c1, r2, c2);
    } else {
      // Vertical wall
      const wallC = c1 + Math.floor(Math.random() * width);
      const passR = r1 + Math.floor(Math.random() * (height + 1));
      for (let r = r1; r <= r2; r++) {
        if (r !== passR) {
          grid[r][wallC].walls.right = true;
          grid[r][wallC + 1].walls.left = true;
        }
      }
      yield [...grid.map(r => [...r])];
      yield* divide(r1, c1, r2, wallC);
      yield* divide(r1, wallC + 1, r2, c2);
    }
  }

  yield* divide(0, 0, rows - 1, cols - 1);
  setupEntryExit(grid);
}

export const solveMaze = (grid: Cell[][]): [number, number][] => {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue: { pos: [number, number], path: [number, number][] }[] = [{ pos: [0, 0], path: [[0, 0]] }];
  const visited = new Set<string>();
  visited.add('0,0');
  while (queue.length > 0) {
    const { pos: [r, c], path } = queue.shift()!;
    if (r === rows - 1 && c === cols - 1) return path;
    const cell = grid[r][c];
    const neighbors: [number, number, keyof Cell['walls']][] = [[r - 1, c, 'top'], [r + 1, c, 'bottom'], [r, c - 1, 'left'], [r, c + 1, 'right']];
    for (const [nr, nc, wall] of neighbors) {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !cell.walls[wall] && !visited.has(`${nr},${nc}`)) {
        visited.add(`${nr},${nc}`);
        queue.push({ pos: [nr, nc], path: [...path, [nr, nc]] });
      }
    }
  }
  return [];
};
