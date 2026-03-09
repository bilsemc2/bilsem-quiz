import assert from 'node:assert/strict';
import test from 'node:test';

import {
    buildQuestionText,
    createAnswerOptions,
    createLevelBalloons,
    getNextUserGuesses,
    pickQuestionType,
    resolveGuesses
} from '../../../../src/components/Arcade/Games/NeseliBalonlar/logic.ts';
import { BALLOON_COLORS } from '../../../../src/components/Arcade/Games/NeseliBalonlar/constants.ts';
import { QuestionType } from '../../../../src/components/Arcade/Games/NeseliBalonlar/types.ts';
import type { BalloonState } from '../../../../src/components/Arcade/Games/NeseliBalonlar/types.ts';

test('pickQuestionType unlocks order questions at higher levels', () => {
    assert.equal(pickQuestionType(1, () => 0.9), QuestionType.COLOR);
    assert.equal(pickQuestionType(3, () => 0.7), QuestionType.POSITION);
    assert.equal(pickQuestionType(5, () => 0.9), QuestionType.ORDER);
});

test('createLevelBalloons produces level-sized visible balloons with positions', () => {
    const balloons = createLevelBalloons(3, () => 0, 1000, BALLOON_COLORS.slice(0, 8));

    assert.equal(balloons.length, 5);
    assert.deepEqual(
        balloons.map((balloon) => balloon.position),
        [0, 1, 2, 3, 4]
    );
    assert.ok(balloons.every((balloon) => balloon.isVisible && !balloon.isPopped));
});

test('createAnswerOptions adds distractors for color questions', () => {
    const balloons: BalloonState[] = [
        {
            id: 1,
            displayValue: 3,
            color: BALLOON_COLORS[0],
            isPopped: false,
            isVisible: true,
            position: 0
        },
        {
            id: 2,
            displayValue: 7,
            color: BALLOON_COLORS[1],
            isPopped: false,
            isVisible: true,
            position: 1
        }
    ];

    const options = createAnswerOptions(QuestionType.COLOR, balloons, 4, [1], () => 0);

    assert.equal(options.filter((option) => option.isDistractor).length, 3);
    assert.ok(options.some((option) => option.label === BALLOON_COLORS[0].name));
    assert.ok(options.some((option) => option.label === BALLOON_COLORS[1].name));
});

test('getNextUserGuesses applies toggle and ordered selection rules', () => {
    assert.deepEqual(
        getNextUserGuesses(QuestionType.NUMBER, [1], 1, 2),
        []
    );
    assert.deepEqual(
        getNextUserGuesses(QuestionType.ORDER, [3, 5], 5, 3),
        [3]
    );
    assert.deepEqual(
        getNextUserGuesses(QuestionType.ORDER, [3], 4, 3),
        [3, 4]
    );
});

test('resolveGuesses validates order and position rounds', () => {
    const balloons: BalloonState[] = [
        {
            id: 11,
            displayValue: 2,
            color: BALLOON_COLORS[0],
            isPopped: false,
            isVisible: true,
            position: 0
        },
        {
            id: 12,
            displayValue: 5,
            color: BALLOON_COLORS[1],
            isPopped: false,
            isVisible: true,
            position: 1
        },
        {
            id: 13,
            displayValue: 8,
            color: BALLOON_COLORS[2],
            isPopped: false,
            isVisible: true,
            position: 2
        }
    ];

    assert.equal(resolveGuesses(QuestionType.ORDER, [12, 11], [11, 12], [12, 11], balloons), true);
    assert.equal(resolveGuesses(QuestionType.ORDER, [11, 12], [11, 12], [12, 11], balloons), false);
    assert.equal(resolveGuesses(QuestionType.POSITION, [11, 13], [13, 11], [13, 11], balloons), true);
});

test('buildQuestionText returns the active question copy', () => {
    assert.deepEqual(buildQuestionText(QuestionType.COLOR, 2), {
        main: 'Hangi 2 balonun',
        highlight: 'RENGI',
        rest: 'patladi?'
    });
});
