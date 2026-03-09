import { BALLOON_COLORS } from './constants.ts';
import type { BalloonColor, BalloonState } from './types.ts';
import { QuestionType } from './types.ts';

type RandomFn = () => number;

const shuffleArray = <T,>(items: T[], random: RandomFn = Math.random): T[] => {
    const next = [...items];

    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }

    return next;
};

export const pickQuestionType = (
    level: number,
    random: RandomFn = Math.random
): QuestionType => {
    if (level <= 2) {
        return random() > 0.5 ? QuestionType.COLOR : QuestionType.NUMBER;
    }

    if (level <= 4) {
        const roll = random();

        if (roll < 0.33) {
            return QuestionType.COLOR;
        }

        if (roll < 0.66) {
            return QuestionType.NUMBER;
        }

        return QuestionType.POSITION;
    }

    const roll = random();

    if (roll < 0.25) {
        return QuestionType.COLOR;
    }

    if (roll < 0.5) {
        return QuestionType.NUMBER;
    }

    if (roll < 0.75) {
        return QuestionType.POSITION;
    }

    return QuestionType.ORDER;
};

export const getWatchDuration = (level: number): number => {
    return Math.max(1500, 3500 - (level - 1) * 300);
};

export const getLevelConfig = (level: number) => {
    const totalBalloons = Math.min(2 + level, 8);
    const numToPop = Math.min(Math.floor((level + 1) / 2), totalBalloons - 1);

    return { totalBalloons, numToPop };
};

export const shouldHideRemainingBalloons = (level: number): boolean => {
    return level >= 3;
};

export const createLevelBalloons = (
    level: number,
    random: RandomFn = Math.random,
    seed: number = Date.now(),
    colors: BalloonColor[] = BALLOON_COLORS
): BalloonState[] => {
    const { totalBalloons } = getLevelConfig(level);
    const randomNumbers = shuffleArray(
        Array.from({ length: 10 }, (_, index) => index + 1),
        random
    ).slice(0, totalBalloons);
    const shuffledColors = shuffleArray(colors, random);

    return shuffledColors.slice(0, totalBalloons).map((color, index) => ({
        id: seed + index + Math.floor(random() * 1000),
        displayValue: randomNumbers[index],
        color,
        isPopped: false,
        isVisible: true,
        position: index
    }));
};

export const createPopSequence = (
    balloons: BalloonState[],
    level: number,
    random: RandomFn = Math.random
): number[] => {
    const { numToPop } = getLevelConfig(level);

    return shuffleArray(balloons, random)
        .slice(0, numToPop)
        .map((balloon) => balloon.id);
};
