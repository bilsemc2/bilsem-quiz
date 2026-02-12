export type Cell = {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
};

export const generateMaze = (cols: number, rows: number): Cell[][] => {
  // Initialize grid
  const grid: Cell[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < cols; x++) {
      row.push({
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      });
    }
    grid.push(row);
  }

  // Recursive Backtracking
  const stack: Cell[] = [];
  const startCell = grid[0][0];
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, grid, cols, rows);

    if (neighbors.length > 0) {
      // Choose random neighbor
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWalls(current, next);
      next.visited = true;
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  // Reset visited flags for gameplay/solving use
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid[y][x].visited = false;
    }
  }

  return grid;
};

// BFS Solver to find the correct path coordinates
export const solveMaze = (maze: Cell[][]): Set<string> => {
    const rows = maze.length;
    const cols = maze[0].length;
    const start = maze[0][0];
    const end = maze[rows - 1][cols - 1];
    
    const queue: { cell: Cell; path: string[] }[] = [];
    const visited = new Set<string>();
    
    queue.push({ cell: start, path: [`${start.x},${start.y}`] });
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
        const { cell, path } = queue.shift()!;
        
        if (cell.x === end.x && cell.y === end.y) {
            return new Set(path);
        }

        const neighbors = getConnectedNeighbors(cell, maze);
        for (const neighbor of neighbors) {
            const key = `${neighbor.x},${neighbor.y}`;
            if (!visited.has(key)) {
                visited.add(key);
                queue.push({ cell: neighbor, path: [...path, key] });
            }
        }
    }
    return new Set();
};

const getConnectedNeighbors = (cell: Cell, grid: Cell[][]): Cell[] => {
    const neighbors: Cell[] = [];
    const { x, y, walls } = cell;

    // Check bounds and walls
    if (!walls.top && y > 0) neighbors.push(grid[y - 1][x]);
    if (!walls.right && x < grid[0].length - 1) neighbors.push(grid[y][x + 1]);
    if (!walls.bottom && y < grid.length - 1) neighbors.push(grid[y + 1][x]);
    if (!walls.left && x > 0) neighbors.push(grid[y][x - 1]);

    return neighbors;
};

const getUnvisitedNeighbors = (cell: Cell, grid: Cell[][], cols: number, rows: number) => {
  const neighbors: Cell[] = [];
  const { x, y } = cell;

  if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]); // Top
  if (x < cols - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]); // Right
  if (y < rows - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]); // Bottom
  if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]); // Left

  return neighbors;
};

const removeWalls = (a: Cell, b: Cell) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  if (dx === 1) {
    a.walls.left = false;
    b.walls.right = false;
  } else if (dx === -1) {
    a.walls.right = false;
    b.walls.left = false;
  }

  if (dy === 1) {
    a.walls.top = false;
    b.walls.bottom = false;
  } else if (dy === -1) {
    a.walls.bottom = false;
    b.walls.top = false;
  }
};