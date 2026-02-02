import { ColorType, Cell } from './types';
import { COLORS } from './constants';

const COLOR_TYPES: ColorType[] = ['RED', 'BLUE', 'YELLOW', 'GREEN'];

export const generateGrid = (gridSize: number): Cell[] => {
    const size = gridSize;
    const totalCells = size * size;
    const grid: (Cell | null)[] = new Array(totalCells).fill(null);

    // Seed count based on grid size
    const seedsCount = Math.max(2, Math.floor(size * 1.5));
    for (let i = 0; i < seedsCount; i++) {
        const randomPos = Math.floor(Math.random() * totalCells);
        const randomColor = COLOR_TYPES[i % COLOR_TYPES.length];
        if (!grid[randomPos]) {
            grid[randomPos] = {
                id: randomPos,
                color: randomColor,
                hex: COLORS[randomColor],
                isRevealed: false,
                isError: false,
            };
        }
    }

    // 2. Growth algorithm: fill empty neighbors
    let emptyIndices = grid.map((val, idx) => (val === null ? idx : -1)).filter(idx => idx !== -1);

    while (emptyIndices.length > 0) {
        const targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        const neighbors = getNeighbors(targetIdx, size);
        const coloredNeighbors = neighbors.filter(n => grid[n] !== null);

        if (coloredNeighbors.length > 0) {
            const sourceNeighborIdx = coloredNeighbors[Math.floor(Math.random() * coloredNeighbors.length)];
            const sourceColor = grid[sourceNeighborIdx]!.color;

            grid[targetIdx] = {
                id: targetIdx,
                color: sourceColor,
                hex: COLORS[sourceColor],
                isRevealed: false,
                isError: false,
            };
        } else {
            const randomColor = COLOR_TYPES[Math.floor(Math.random() * COLOR_TYPES.length)];
            grid[targetIdx] = {
                id: targetIdx,
                color: randomColor,
                hex: COLORS[randomColor],
                isRevealed: false,
                isError: false,
            };
        }
        emptyIndices = grid.map((val, idx) => (val === null ? idx : -1)).filter(idx => idx !== -1);
    }

    return grid as Cell[];
};

const getNeighbors = (index: number, size: number): number[] => {
    const neighbors = [];
    const x = index % size;
    const y = Math.floor(index / size);

    if (x > 0) neighbors.push(index - 1);
    if (x < size - 1) neighbors.push(index + 1);
    if (y > 0) neighbors.push(index - size);
    if (y < size - 1) neighbors.push(index + size);

    return neighbors;
};
