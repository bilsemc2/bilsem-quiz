import { COLOR_KEYS } from './constants.ts';
import type { Bubble, BubbleColor, Point } from './types.ts';

type PatternType = 'abab' | 'abcabc' | 'aabb' | 'abccab';

interface BubbleGridLayout {
    width: number;
    bubbleRadius: number;
    gridCols: number;
    gridOffsetY: number;
}

interface PatternDefinition {
    pattern: BubbleColor[];
    correct: BubbleColor;
}

const PATTERN_TYPES: PatternType[] = ['abab', 'abcabc', 'aabb', 'abccab'];

const shuffleColors = (
    colors: BubbleColor[],
    randomFn: () => number = Math.random
) => {
    const next = [...colors];

    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(randomFn() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }

    return next;
};

export const buildPatternDefinition = (
    type: PatternType,
    colors: BubbleColor[]
): PatternDefinition => {
    if (type === 'abab') {
        return {
            pattern: [colors[0], colors[1], colors[0], colors[1]],
            correct: colors[0]
        };
    }

    if (type === 'abcabc') {
        return {
            pattern: [colors[0], colors[1], colors[2], colors[0], colors[1]],
            correct: colors[2]
        };
    }

    if (type === 'aabb') {
        return {
            pattern: [colors[0], colors[0], colors[1], colors[1]],
            correct: colors[0]
        };
    }

    return {
        pattern: [colors[0], colors[1], colors[2], colors[2], colors[0]],
        correct: colors[1]
    };
};

export const generatePatternDefinition = (
    randomFn: () => number = Math.random
): PatternDefinition => {
    const type = PATTERN_TYPES[Math.floor(randomFn() * PATTERN_TYPES.length)];
    const shuffledColors = shuffleColors(COLOR_KEYS, randomFn);
    return buildPatternDefinition(type, shuffledColors);
};

export const getBubblePos = (
    row: number,
    col: number,
    layout: BubbleGridLayout
): Point => {
    const radius = layout.bubbleRadius;
    const xOffset = (layout.width - (layout.gridCols * radius * 2)) / 2 + radius;
    const isOddRow = row % 2 !== 0;

    return {
        x: xOffset + col * (radius * 2) + (isOddRow ? radius : 0),
        y: radius + row * (radius * Math.sqrt(3)) + layout.gridOffsetY
    };
};

export const createInitialBubbles = (
    layout: BubbleGridLayout,
    rows: number = 5,
    randomFn: () => number = Math.random
) => {
    const nextBubbles: Bubble[] = [];

    for (let row = 0; row < rows; row += 1) {
        const columns = row % 2 !== 0 ? layout.gridCols - 1 : layout.gridCols;

        for (let col = 0; col < columns; col += 1) {
            const position = getBubblePos(row, col, layout);
            nextBubbles.push({
                id: `${row}-${col}`,
                row,
                col,
                x: position.x,
                y: position.y,
                color: COLOR_KEYS[Math.floor(randomFn() * COLOR_KEYS.length)],
                active: true
            });
        }
    }

    return nextBubbles;
};

export const repositionBubbles = (
    bubbles: Bubble[],
    layout: BubbleGridLayout
) => {
    return bubbles.map((bubble) => ({
        ...bubble,
        ...getBubblePos(bubble.row, bubble.col, layout)
    }));
};

export const ensureTargetAccessible = (
    bubbles: Bubble[],
    targetColor: BubbleColor,
    gridCols: number,
    randomFn: () => number = Math.random
) => {
    const nextBubbles = bubbles.map((bubble) => ({ ...bubble }));
    const sortRandomly = (items: Bubble[]) =>
        [...items].sort(() => randomFn() - 0.5);

    const bottomRowBubbles = nextBubbles.filter(
        (bubble) => bubble.row >= 3 && bubble.active
    );
    const bottomTargetBubbles = bottomRowBubbles.filter(
        (bubble) => bubble.color === targetColor
    );

    if (bottomTargetBubbles.length < 3) {
        const needed = 3 - bottomTargetBubbles.length;
        const candidates = sortRandomly(
            bottomRowBubbles.filter((bubble) => bubble.color !== targetColor)
        );

        for (let index = 0; index < Math.min(needed, candidates.length); index += 1) {
            candidates[index].color = targetColor;
        }
    }

    const edgeBubbles = nextBubbles.filter((bubble) =>
        bubble.active && (
            bubble.col === 0 ||
            bubble.col === gridCols - 1 ||
            (bubble.row % 2 !== 0 && bubble.col === gridCols - 2)
        )
    );
    const edgeTargetBubbles = edgeBubbles.filter(
        (bubble) => bubble.color === targetColor
    );

    if (edgeTargetBubbles.length < 2) {
        const needed = 2 - edgeTargetBubbles.length;
        const candidates = sortRandomly(
            edgeBubbles.filter((bubble) => bubble.color !== targetColor)
        );

        for (let index = 0; index < Math.min(needed, candidates.length); index += 1) {
            candidates[index].color = targetColor;
        }
    }

    return nextBubbles;
};

export const isNeighbor = (first: Bubble, second: Bubble) => {
    const rowDiff = second.row - first.row;
    const colDiff = second.col - first.col;

    if (Math.abs(rowDiff) > 1) {
        return false;
    }

    if (rowDiff === 0) {
        return Math.abs(colDiff) === 1;
    }

    return first.row % 2 !== 0
        ? colDiff === 0 || colDiff === 1
        : colDiff === -1 || colDiff === 0;
};

export const collectMatchingBubbles = (
    hitBubble: Bubble,
    bubbles: Bubble[]
) => {
    const toCheck = [hitBubble];
    const visited = new Set<string>();
    const matches: Bubble[] = [];

    while (toCheck.length > 0) {
        const current = toCheck.pop();
        if (!current || visited.has(current.id)) {
            continue;
        }

        visited.add(current.id);
        if (current.color !== hitBubble.color) {
            continue;
        }

        matches.push(current);
        const neighbors = bubbles.filter((bubble) =>
            bubble.active &&
            !visited.has(bubble.id) &&
            isNeighbor(current, bubble)
        );
        toCheck.push(...neighbors);
    }

    return matches;
};
