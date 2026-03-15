import assert from 'node:assert/strict';
import test from 'node:test';

import { COLOR_LABELS, COLORS, LEVEL_CONFIG } from '../../../../src/components/Arcade/Games/RenkliLambalar/constants.ts';
import { generateGrid } from '../../../../src/components/Arcade/Games/RenkliLambalar/utils.ts';

const createSequenceRandom = (...values: number[]) => {
    let index = 0;

    return () => {
        const next = values[index] ?? values[values.length - 1] ?? 0;
        index += 1;
        return next;
    };
};

test('level config scales grid size and memorize duration across the intended bands', () => {
    assert.deepEqual(LEVEL_CONFIG[1], { gridSize: 3, memorizeTime: 5 });
    assert.deepEqual(LEVEL_CONFIG[5], { gridSize: 5, memorizeTime: 4 });
    assert.deepEqual(LEVEL_CONFIG[10], { gridSize: 6, memorizeTime: 2 });
});

test('generateGrid fills every cell with a supported color and stable metadata', () => {
    const grid = generateGrid(
        4,
        createSequenceRandom(0, 0.25, 0.5, 0.75, ...Array.from({ length: 64 }, () => 0.4))
    );

    assert.equal(grid.length, 16);
    assert.equal(new Set(grid.map((cell) => cell.id)).size, grid.length);
    assert.ok(grid.every((cell) => cell.id >= 0 && cell.id < grid.length));
    assert.ok(grid.every((cell) => Object.values(COLORS).includes(cell.hex)));
    assert.ok(grid.every((cell) => COLOR_LABELS[cell.color].length > 0));
    assert.ok(grid.every((cell) => cell.isRevealed === false));
    assert.ok(grid.every((cell) => cell.isError === false));
});
