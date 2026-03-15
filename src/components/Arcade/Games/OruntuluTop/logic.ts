import { ARCADE_SCORE_BASE, ARCADE_SCORE_FORMULA } from '../../Shared/ArcadeConstants.ts';
import { COLOR_KEYS, POWER_UP_CONFIG } from './constants.ts';
import type { Bubble, BubbleColor, BubblePowerUp, Point } from './types.ts';

type PatternType = 'abab' | 'abcabc' | 'aabb' | 'abccab' | 'abcabca' | 'abcaabc';

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
const ADVANCED_PATTERN_TYPES: PatternType[] = ['abcabca', 'abcaabc'];

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

    if (type === 'abcabca') {
        return {
            pattern: [colors[0], colors[1], colors[2], colors[0], colors[1], colors[2]],
            correct: colors[0]
        };
    }

    if (type === 'abcaabc') {
        return {
            pattern: [colors[0], colors[1], colors[2], colors[0], colors[0], colors[1]],
            correct: colors[2]
        };
    }

    return {
        pattern: [colors[0], colors[1], colors[2], colors[2], colors[0]],
        correct: colors[1]
    };
};

export const getPatternTypesForLevel = (level: number): PatternType[] => {
    if (level >= 7) {
        return [...PATTERN_TYPES, ...ADVANCED_PATTERN_TYPES];
    }

    if (level >= 4) {
        return PATTERN_TYPES;
    }

    return ['abab', 'aabb', 'abcabc'];
};

export const generatePatternDefinition = (
    level: number = 1,
    randomFn: () => number = Math.random
): PatternDefinition => {
    const availableTypes = getPatternTypesForLevel(level);
    const type = availableTypes[Math.floor(randomFn() * availableTypes.length)];
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
                active: true,
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

const shuffleBubbles = (
    bubbles: Bubble[],
    randomFn: () => number = Math.random
) => {
    const next = [...bubbles];

    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(randomFn() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }

    return next;
};

export const decorateBubblesWithPowerUps = (
    bubbles: Bubble[],
    targetColor: BubbleColor,
    level: number,
    randomFn: () => number = Math.random
) => {
    const nextBubbles = bubbles.map((bubble) => ({ ...bubble, powerUp: undefined }));
    const targetCandidates = shuffleBubbles(
        nextBubbles.filter((bubble) => bubble.active && bubble.color === targetColor && bubble.row >= 2),
        randomFn
    );

    if (level >= 2 && targetCandidates.length > 0 && randomFn() >= 0.35) {
        targetCandidates[0].powerUp = 'star';
    }

    if (level >= 4 && targetCandidates.length > 1 && randomFn() >= 0.6) {
        targetCandidates[1].powerUp = 'heart';
    }

    return nextBubbles;
};

export const getPowerUpSummary = (bubbles: Bubble[]) => {
    return bubbles.reduce(
        (summary, bubble) => {
            if (!bubble.active || !bubble.powerUp) {
                return summary;
            }

            summary[bubble.powerUp] += 1;
            return summary;
        },
        { star: 0, heart: 0 }
    );
};

export const getComboMultiplier = (comboStreak: number) => {
    const safeCombo = Math.max(1, comboStreak);
    return 1 + Math.min(safeCombo - 1, 4) * 0.2;
};

export const calculateMatchReward = ({
    level,
    clusterSize,
    comboStreak,
    powerUps,
    currentLives,
    maxLives = 3
}: {
    level: number;
    clusterSize: number;
    comboStreak: number;
    powerUps: BubblePowerUp[];
    currentLives: number;
    maxLives?: number;
}) => {
    const comboMultiplier = getComboMultiplier(comboStreak);
    const basePoints = ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level) + (clusterSize * 100);
    const comboBonus = Math.round(basePoints * (comboMultiplier - 1));
    const starBonus = powerUps.filter((powerUp) => powerUp === 'star').length * POWER_UP_CONFIG.star.bonusPoints;
    const heartCount = powerUps.filter((powerUp) => powerUp === 'heart').length;
    const lifeGain = Math.min(Math.max(maxLives - currentLives, 0), heartCount);
    const overflowHeartBonus = Math.max(heartCount - lifeGain, 0) * POWER_UP_CONFIG.heart.bonusPoints;

    return {
        comboMultiplier,
        basePoints,
        comboBonus,
        starBonus,
        lifeGain,
        overflowHeartBonus,
        totalPoints: basePoints + comboBonus + starBonus + overflowHeartBonus
    };
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
