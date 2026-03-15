import assert from 'node:assert/strict';
import test from 'node:test';

import { COLORS, GRID_SIZE } from '../../../../src/components/Arcade/Games/YolBulmaca/constants.ts';
import {
    generateQuestion,
    generateSequence,
    generateSmartPositions
} from '../../../../src/components/Arcade/Games/YolBulmaca/utils.ts';
import type { GridPos, SequenceItem } from '../../../../src/components/Arcade/Games/YolBulmaca/types.ts';

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

const getExcludedCells = (start: GridPos, goal: GridPos) => [
    start,
    goal,
    { row: start.row, col: start.col + (start.col === 0 ? 1 : -1) },
    { row: goal.row, col: goal.col + (goal.col === 0 ? 1 : -1) }
];

test('generateSequence scales with level and keeps items inside the supported pools', () => {
    const sequence = generateSequence(
        9,
        createSequenceRandom(0.9, 0.1, 0.1, 0.45, 0.8, 0.2, 0.2, 0.7, 0.95, 0.4, 0.05, 0.25, 0.75, 0.6)
    );

    assert.equal(sequence.length, 7);
    assert.ok(sequence.some((item) => item.type === 'color'));
    assert.ok(sequence.some((item) => item.type === 'number'));
    assert.ok(
        sequence.every((item) =>
            item.type === 'color'
                ? COLORS.some((color) => color.name === item.value)
                : Number.isInteger(item.value) && item.value >= 1 && item.value <= 20
        )
    );
});

test('generateQuestion keeps the answer in options for reverse and logic prompts', () => {
    const reverseSequence: SequenceItem[] = [
        { type: 'color', value: 'Mavi' },
        { type: 'number', value: 8 },
        { type: 'color', value: 'Kırmızı' },
        { type: 'number', value: 4 }
    ];
    const reverseQuestion = generateQuestion(
        reverseSequence,
        1,
        createSequenceRandom(0.75, 0, 0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7)
    );

    assert.equal(reverseQuestion.text, 'Son sıradaki rakam nedir?');
    assert.equal(reverseQuestion.answer, 4);
    assert.equal(reverseQuestion.options.length, 4);
    assert.ok(reverseQuestion.options.includes(reverseQuestion.answer));

    const logicSequence: SequenceItem[] = [
        { type: 'number', value: 3 },
        { type: 'color', value: 'Yeşil' },
        { type: 'number', value: 5 },
        { type: 'number', value: 2 }
    ];
    const logicQuestion = generateQuestion(
        logicSequence,
        5,
        createSequenceRandom(0.95, 0, 0.9, 0.2, 0.7, 0.4, 0.6, 0.1, 0.8)
    );

    assert.equal(logicQuestion.text, '1. ve 3. sıradaki rakamların toplamı kaçtır?');
    assert.equal(logicQuestion.answer, 8);
    assert.equal(logicQuestion.options.length, 4);
    assert.ok(logicQuestion.options.includes(logicQuestion.answer));
});

test('generateSmartPositions keeps the correct answer on the route corridor', () => {
    const { start, goal, optionPositions } = generateSmartPositions(
        2,
        4,
        createSequenceRandom(0, ...Array.from({ length: 64 }, () => 0.25))
    );
    const excludedCells = getExcludedCells(start, goal);

    assert.deepEqual(start, { row: 0, col: 0 });
    assert.deepEqual(goal, { row: GRID_SIZE - 1, col: GRID_SIZE - 1 });
    assert.equal(optionPositions.length, 4);
    assert.equal(
        new Set(optionPositions.map((position) => `${position.row}-${position.col}`)).size,
        optionPositions.length
    );
    assert.ok(isOnPath(optionPositions[2], start, goal));
    assert.ok(optionPositions.every((position) => position.row >= 0 && position.row < GRID_SIZE));
    assert.ok(optionPositions.every((position) => position.col >= 0 && position.col < GRID_SIZE));
    assert.ok(
        optionPositions.every((position) =>
            !excludedCells.some((excludedCell) => excludedCell.row === position.row && excludedCell.col === position.col)
        )
    );
});
