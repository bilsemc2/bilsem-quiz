import assert from 'node:assert/strict';
import test from 'node:test';

import {
    calculateCanvasSize,
    clampJoystickPosition,
    clearCollectedItems,
    getActiveDirection,
    getSwipeDirection,
    resolveMoveOutcome
} from '../../../../src/components/Arcade/Games/DarkMaze/logic.ts';
import type { Cell } from '../../../../src/components/Arcade/Games/DarkMaze/types.ts';

const createCell = (
    row: number,
    column: number,
    overrides: Partial<Cell> = {}
): Cell => ({
    r: row,
    c: column,
    walls: [false, false, false, false],
    visited: false,
    hasBattery: false,
    hasLogo: false,
    ...overrides
});

test('calculateCanvasSize clamps to viewport and ideal size', () => {
    assert.equal(calculateCanvasSize(400, 10, 40), 352);
    assert.equal(calculateCanvasSize(1200, 10, 40), 400);
});

test('resolveMoveOutcome respects maze walls and reports collectibles', () => {
    const maze: Cell[][] = [
        [createCell(0, 0, { walls: [true, false, false, true] }), createCell(0, 1, { hasBattery: true })],
        [createCell(1, 0), createCell(1, 1, { hasLogo: true })]
    ];

    assert.deepEqual(
        resolveMoveOutcome(maze, { r: 0, c: 0 }, 'up', 2),
        {
            position: { r: 0, c: 0 },
            moved: false,
            collectedBattery: false,
            collectedLogo: false,
            reachedExit: false
        }
    );

    assert.deepEqual(
        resolveMoveOutcome(maze, { r: 0, c: 0 }, 'right', 2),
        {
            position: { r: 0, c: 1 },
            moved: true,
            collectedBattery: true,
            collectedLogo: false,
            reachedExit: false
        }
    );

    assert.deepEqual(
        resolveMoveOutcome(maze, { r: 1, c: 0 }, 'right', 2),
        {
            position: { r: 1, c: 1 },
            moved: true,
            collectedBattery: false,
            collectedLogo: true,
            reachedExit: true
        }
    );
});

test('clearCollectedItems clears only the requested collectibles', () => {
    const maze: Cell[][] = [
        [createCell(0, 0), createCell(0, 1, { hasBattery: true, hasLogo: true })]
    ];

    const updated = clearCollectedItems(maze, { r: 0, c: 1 }, true, false);

    assert.equal(updated[0][1].hasBattery, false);
    assert.equal(updated[0][1].hasLogo, true);
    assert.equal(updated[0][0], maze[0][0]);
});

test('joystick helpers clamp vectors and derive the dominant direction', () => {
    assert.deepEqual(clampJoystickPosition(80, 0, 50), { x: 50, y: 0 });
    assert.equal(getActiveDirection({ x: 0, y: 10 }, 25), null);
    assert.equal(getActiveDirection({ x: -30, y: 5 }, 25), 'left');
    assert.equal(getActiveDirection({ x: 10, y: 40 }, 25), 'down');
});

test('getSwipeDirection resolves axis-dominant gestures', () => {
    assert.equal(
        getSwipeDirection({ x: 10, y: 10 }, { x: 60, y: 20 }, 30),
        'right'
    );
    assert.equal(
        getSwipeDirection({ x: 20, y: 40 }, { x: 10, y: 0 }, 30),
        'up'
    );
    assert.equal(
        getSwipeDirection({ x: 10, y: 10 }, { x: 20, y: 25 }, 30),
        null
    );
});
