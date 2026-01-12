import { useCallback } from 'react';
import { Cell } from '../types';
import { INITIAL_GRID_SIZE } from '../constants';

export const useMazeGenerator = () => {
    const generateMaze = useCallback((size: number, level: number): Cell[][] => {
        const grid: Cell[][] = [];
        for (let r = 0; r < size; r++) {
            grid[r] = [];
            for (let c = 0; c < size; c++) {
                grid[r][c] = {
                    r, c,
                    walls: [true, true, true, true],
                    visited: false,
                    hasBattery: Math.random() < Math.max(0.04, 0.08 - (level * 0.005)),
                    hasLogo: Math.random() < 0.03
                };
            }
        }

        const stack: Cell[] = [];
        let current = grid[0][0];
        current.visited = true;

        const getNeighbors = (cell: Cell) => {
            const neighbors: Cell[] = [];
            const { r, c } = cell;
            if (r > 0 && !grid[r - 1][c].visited) neighbors.push(grid[r - 1][c]);
            if (r < size - 1 && !grid[r + 1][c].visited) neighbors.push(grid[r + 1][c]);
            if (c > 0 && !grid[r][c - 1].visited) neighbors.push(grid[r][c - 1]);
            if (c < size - 1 && !grid[r][c + 1].visited) neighbors.push(grid[r][c + 1]);
            return neighbors;
        };

        const removeWalls = (a: Cell, b: Cell) => {
            const dr = a.r - b.r;
            const dc = a.c - b.c;
            if (dr === 1) { a.walls[0] = false; b.walls[2] = false; }
            else if (dr === -1) { a.walls[2] = false; b.walls[0] = false; }
            else if (dc === 1) { a.walls[3] = false; b.walls[1] = false; }
            else if (dc === -1) { a.walls[1] = false; b.walls[3] = false; }
        };

        let visitedCount = 1;
        const totalCells = size * size;

        while (visitedCount < totalCells) {
            const neighbors = getNeighbors(current);
            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                removeWalls(current, next);
                stack.push(current);
                current = next;
                current.visited = true;
                visitedCount++;
            } else if (stack.length > 0) {
                current = stack.pop()!;
            }
        }

        // Ensure starting cell has no items and exit is clear
        grid[0][0].hasBattery = false;
        grid[0][0].hasLogo = false;
        grid[size - 1][size - 1].hasBattery = false;
        grid[size - 1][size - 1].hasLogo = false;

        return grid;
    }, []);

    const getNextLevelSize = (currentLevel: number) => {
        return Math.min(25, INITIAL_GRID_SIZE + currentLevel * 2);
    };

    return { generateMaze, getNextLevelSize };
};
