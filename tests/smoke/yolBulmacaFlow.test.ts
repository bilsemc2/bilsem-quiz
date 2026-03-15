import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { GRID_SIZE } from '../../src/components/Arcade/Games/YolBulmaca/constants.ts';
import {
    generateQuestion,
    generateSequence,
    generateSmartPositions
} from '../../src/components/Arcade/Games/YolBulmaca/utils.ts';
import type { GridPos } from '../../src/components/Arcade/Games/YolBulmaca/types.ts';

const createSequenceRandom = (...values: number[]) => {
    let index = 0;

    return () => {
        const next = values[index] ?? values[values.length - 1] ?? 0;
        index += 1;
        return next;
    };
};

const isOnPath = (cell: GridPos, start: GridPos, goal: GridPos) => {
    const expectedCol = start.col + ((goal.col - start.col) * (cell.row - start.row)) / (goal.row - start.row || 1);
    return Math.abs(cell.col - expectedCol) <= 1.5;
};

test('yol bulmaca smoke covers route, catalog and a playable round', () => {
    const routeSource = readFileSync(new URL('../../src/routes/arcadeRoutes.tsx', import.meta.url), 'utf8');
    const catalogSource = readFileSync(new URL('../../src/data/arcade/games.tsx', import.meta.url), 'utf8');

    assert.match(routeSource, /path="\/bilsem-zeka\/yol-bulmaca"/);
    assert.match(catalogSource, /id:\s*'yol-bulmaca'/);
    assert.match(catalogSource, /link:\s*"\/bilsem-zeka\/yol-bulmaca"/);

    const sequence = generateSequence(
        4,
        createSequenceRandom(0.9, 0.1, 0.1, 0.4, 0.8, 0.3, 0.2, 0.6, 0.7, 0.4)
    );
    const question = generateQuestion(
        sequence,
        4,
        createSequenceRandom(0.95, 0, 0.9, 0.2, 0.7, 0.4, 0.6, 0.1, 0.8)
    );
    const correctAnswerIndex = question.options.findIndex((option) => option === question.answer);
    const { start, goal, optionPositions } = generateSmartPositions(
        correctAnswerIndex,
        question.options.length,
        createSequenceRandom(0, ...Array.from({ length: 64 }, () => 0.25))
    );

    assert.equal(sequence.length, 5);
    assert.equal(question.text, '2. ve 4. sıradaki rakamların toplamı kaçtır?');
    assert.equal(question.answer, 22);
    assert.equal(question.options.length, 4);
    assert.ok(correctAnswerIndex >= 0);
    assert.equal(optionPositions.length, question.options.length);
    assert.deepEqual(start, { row: 0, col: 0 });
    assert.deepEqual(goal, { row: GRID_SIZE - 1, col: GRID_SIZE - 1 });
    assert.ok(isOnPath(optionPositions[correctAnswerIndex], start, goal));
    assert.equal(
        new Set(optionPositions.map((position) => `${position.row}-${position.col}`)).size,
        optionPositions.length
    );
});
