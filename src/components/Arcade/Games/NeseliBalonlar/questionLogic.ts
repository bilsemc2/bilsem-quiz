import { BALLOON_COLORS } from './constants.ts';
import type { AnswerOption, BalloonState, QuestionText } from './types.ts';
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

export const createAnswerOptions = (
    questionType: QuestionType,
    balloons: BalloonState[],
    level: number,
    poppedIndices: number[],
    random: RandomFn = Math.random
): AnswerOption[] => {
    if (questionType === QuestionType.COLOR) {
        const usedColorNames = new Set(balloons.map((balloon) => balloon.color.name));
        const distractors = BALLOON_COLORS.filter((color) => !usedColorNames.has(color.name));
        const distractorCount = Math.min(Math.floor(level / 2) + 1, distractors.length, 3);
        const options: AnswerOption[] = balloons.map((balloon) => ({
            id: balloon.id,
            label: balloon.color.name,
            colorDot: balloon.color.primary,
            isDistractor: false
        }));

        shuffleArray(distractors, random)
            .slice(0, distractorCount)
            .forEach((color, index) => {
                options.push({
                    id: -(index + 1),
                    label: color.name,
                    colorDot: color.primary,
                    isDistractor: true
                });
            });

        return shuffleArray(options, random);
    }

    if (questionType === QuestionType.NUMBER) {
        const usedNumbers = new Set(balloons.map((balloon) => balloon.displayValue));
        const unusedNumbers = Array.from({ length: 10 }, (_, index) => index + 1).filter(
            (value) => !usedNumbers.has(value)
        );
        const distractorCount = Math.min(Math.floor(level / 2) + 1, unusedNumbers.length, 3);
        const options: AnswerOption[] = balloons.map((balloon) => ({
            id: balloon.id,
            label: String(balloon.displayValue),
            isDistractor: false
        }));

        shuffleArray(unusedNumbers, random)
            .slice(0, distractorCount)
            .forEach((value, index) => {
                options.push({
                    id: -(index + 1),
                    label: String(value),
                    isDistractor: true
                });
            });

        return shuffleArray(options, random);
    }

    if (questionType === QuestionType.POSITION) {
        return [...balloons]
            .sort((left, right) => left.position - right.position)
            .map((balloon) => ({
                id: balloon.id,
                label: `${balloon.position + 1}. sira`,
                isDistractor: false
            }));
    }

    return shuffleArray(
        balloons
            .filter((balloon) => poppedIndices.includes(balloon.id))
            .map((balloon) => ({
                id: balloon.id,
                label: balloon.color.name,
                colorDot: balloon.color.primary,
                isDistractor: false
            })),
        random
    );
};

export const getNextUserGuesses = (
    questionType: QuestionType,
    currentGuesses: number[],
    optionId: number,
    maxSelections: number
): number[] => {
    if (questionType === QuestionType.ORDER) {
        if (currentGuesses[currentGuesses.length - 1] === optionId) {
            return currentGuesses.slice(0, -1);
        }

        if (currentGuesses.includes(optionId) || currentGuesses.length >= maxSelections) {
            return currentGuesses;
        }

        return [...currentGuesses, optionId];
    }

    if (currentGuesses.includes(optionId)) {
        return currentGuesses.filter((guess) => guess !== optionId);
    }

    if (currentGuesses.length >= maxSelections) {
        return currentGuesses;
    }

    return [...currentGuesses, optionId];
};

export const resolveGuesses = (
    questionType: QuestionType,
    userGuesses: number[],
    poppedIndices: number[],
    popOrder: number[],
    balloons: BalloonState[]
): boolean => {
    if (questionType === QuestionType.ORDER) {
        return (
            userGuesses.length === popOrder.length &&
            userGuesses.every((guess, index) => guess === popOrder[index])
        );
    }

    if (questionType === QuestionType.POSITION) {
        const poppedPositions = poppedIndices
            .map((id) => balloons.find((balloon) => balloon.id === id)?.position)
            .filter((position): position is number => position !== undefined);
        const guessedPositions = userGuesses
            .map((id) => balloons.find((balloon) => balloon.id === id)?.position)
            .filter((position): position is number => position !== undefined);

        return (
            guessedPositions.length === poppedPositions.length &&
            guessedPositions.every((position) => poppedPositions.includes(position))
        );
    }

    return (
        userGuesses.length === poppedIndices.length &&
        userGuesses.every((guess) => poppedIndices.includes(guess))
    );
};

export const buildQuestionText = (
    questionType: QuestionType,
    poppedCount: number
): QuestionText => {
    switch (questionType) {
        case QuestionType.COLOR:
            return {
                main: `Hangi ${poppedCount} balonun`,
                highlight: 'RENGI',
                rest: 'patladi?'
            };
        case QuestionType.NUMBER:
            return {
                main: `Hangi ${poppedCount} balonun`,
                highlight: 'RAKAMI',
                rest: 'patladi?'
            };
        case QuestionType.POSITION:
            return {
                main: `Patlayan ${poppedCount} balon`,
                highlight: 'NEREDE',
                rest: 'duruyordu?'
            };
        case QuestionType.ORDER:
            return {
                main: 'Balonlar hangi',
                highlight: 'SIRADA',
                rest: 'patladi?'
            };
        default:
            return {
                main: '',
                highlight: '',
                rest: ''
            };
    }
};
