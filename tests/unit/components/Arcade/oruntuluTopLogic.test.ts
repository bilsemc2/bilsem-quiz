import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildPatternDefinition,
    collectMatchingBubbles,
    ensureTargetAccessible
} from '../../../../src/components/Arcade/Games/OruntuluTop/logic.ts';
import type { Bubble } from '../../../../src/components/Arcade/Games/OruntuluTop/types.ts';

test('buildPatternDefinition returns the expected completion color', () => {
    const abcPattern = buildPatternDefinition('abcabc', ['red', 'blue', 'green']);
    const abccabPattern = buildPatternDefinition('abccab', ['purple', 'yellow', 'orange']);

    assert.deepEqual(abcPattern, {
        pattern: ['red', 'blue', 'green', 'red', 'blue'],
        correct: 'green'
    });

    assert.deepEqual(abccabPattern, {
        pattern: ['purple', 'yellow', 'orange', 'orange', 'purple'],
        correct: 'yellow'
    });
});

test('ensureTargetAccessible injects target color into lower rows and edges', () => {
    const bubbles: Bubble[] = [
        { id: '0-0', row: 0, col: 0, x: 0, y: 0, color: 'red', active: true },
        { id: '3-0', row: 3, col: 0, x: 0, y: 0, color: 'blue', active: true },
        { id: '3-1', row: 3, col: 1, x: 0, y: 0, color: 'blue', active: true },
        { id: '4-0', row: 4, col: 0, x: 0, y: 0, color: 'blue', active: true },
        { id: '4-5', row: 4, col: 5, x: 0, y: 0, color: 'blue', active: true },
        { id: '4-1', row: 4, col: 1, x: 0, y: 0, color: 'blue', active: true }
    ];

    const updated = ensureTargetAccessible(bubbles, 'green', 6, () => 0.1);
    const bottomTargets = updated.filter((bubble) => bubble.row >= 3 && bubble.color === 'green');
    const edgeTargets = updated.filter((bubble) =>
        bubble.color === 'green' &&
        (bubble.col === 0 || bubble.col === 5 || (bubble.row % 2 !== 0 && bubble.col === 4))
    );

    assert.ok(bottomTargets.length >= 3);
    assert.ok(edgeTargets.length >= 2);
});

test('collectMatchingBubbles returns only connected bubbles of the same color', () => {
    const bubbles: Bubble[] = [
        { id: '0-0', row: 0, col: 0, x: 0, y: 0, color: 'red', active: true },
        { id: '0-1', row: 0, col: 1, x: 0, y: 0, color: 'red', active: true },
        { id: '1-0', row: 1, col: 0, x: 0, y: 0, color: 'red', active: true },
        { id: '1-1', row: 1, col: 1, x: 0, y: 0, color: 'blue', active: true },
        { id: '3-3', row: 3, col: 3, x: 0, y: 0, color: 'red', active: true }
    ];

    const matches = collectMatchingBubbles(bubbles[0], bubbles);

    assert.deepEqual(
        matches.map((bubble) => bubble.id).sort(),
        ['0-0', '0-1', '1-0']
    );
});
