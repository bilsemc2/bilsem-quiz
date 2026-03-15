import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { LEVEL_CONFIG } from '../../src/components/Arcade/Games/RenkliLambalar/constants.ts';
import { generateGrid } from '../../src/components/Arcade/Games/RenkliLambalar/utils.ts';

const createSequenceRandom = (...values: number[]) => {
    let index = 0;

    return () => {
        const next = values[index] ?? values[values.length - 1] ?? 0;
        index += 1;
        return next;
    };
};

test('renkli lambalar smoke covers route, catalog and a playable memorization grid', () => {
    const routeSource = readFileSync(new URL('../../src/routes/arcadeRoutes.tsx', import.meta.url), 'utf8');
    const catalogSource = readFileSync(new URL('../../src/data/arcade/games.tsx', import.meta.url), 'utf8');

    assert.match(routeSource, /path="\/bilsem-zeka\/renkli-lambalar"/);
    assert.match(catalogSource, /id:\s*'renkli-lambalar'/);
    assert.match(catalogSource, /link:\s*"\/bilsem-zeka\/renkli-lambalar"/);

    const levelConfig = LEVEL_CONFIG[8];
    const grid = generateGrid(
        levelConfig.gridSize,
        createSequenceRandom(0, 0.16, 0.32, 0.48, 0.64, 0.8, ...Array.from({ length: 128 }, () => 0.5))
    );

    assert.equal(levelConfig.gridSize, 6);
    assert.equal(levelConfig.memorizeTime, 3);
    assert.equal(grid.length, 36);
    assert.equal(new Set(grid.map((cell) => cell.id)).size, grid.length);
    assert.ok(new Set(grid.map((cell) => cell.color)).size >= 3);
    assert.ok(grid.every((cell) => cell.hex.length > 0));
});
