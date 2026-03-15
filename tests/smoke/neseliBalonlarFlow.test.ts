import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
    createAnswerOptions,
    createLevelBalloons,
    createPopSequence,
    getLevelConfig,
} from '../../src/components/Arcade/Games/NeseliBalonlar/logic.ts';
import { BALLOON_COLORS } from '../../src/components/Arcade/Games/NeseliBalonlar/constants.ts';
import { QuestionType } from '../../src/components/Arcade/Games/NeseliBalonlar/types.ts';

test('neseli balonlar smoke covers route, catalog and a stable pop sequence', () => {
    const routeSource = readFileSync(new URL('../../src/routes/arcadeRoutes.tsx', import.meta.url), 'utf8');
    const catalogSource = readFileSync(new URL('../../src/data/arcade/games.tsx', import.meta.url), 'utf8');

    assert.match(routeSource, /path="\/bilsem-zeka\/neseli-balonlar"/);
    assert.match(catalogSource, /id:\s*'neseli-balonlar'/);
    assert.match(catalogSource, /link:\s*"\/bilsem-zeka\/neseli-balonlar"/);

    const scriptedRandomValues = [
        ...Array.from({ length: 16 }, () => 0),
        0.005,
        0.004,
        0.003,
        0.002,
        0.001,
        0,
        0,
        0,
    ];
    let cursor = 0;
    const random = () => scriptedRandomValues[cursor++] ?? 0;

    const balloons = createLevelBalloons(6, random, 1000, BALLOON_COLORS.slice(0, 8));
    const popSequence = createPopSequence(balloons, 6, () => 0);
    const uniqueBalloonIds = new Set(balloons.map((balloon) => balloon.id));
    const uniquePoppedIds = new Set(popSequence);
    const orderOptions = createAnswerOptions(QuestionType.ORDER, balloons, 6, popSequence, () => 0);

    assert.equal(balloons.length, 8);
    assert.equal(uniqueBalloonIds.size, balloons.length);
    assert.equal(popSequence.length, getLevelConfig(6).numToPop);
    assert.equal(uniquePoppedIds.size, popSequence.length);
    assert.ok(popSequence.every((id) => balloons.some((balloon) => balloon.id === id)));
    assert.equal(orderOptions.length, popSequence.length);
    assert.deepEqual(
        [...new Set(orderOptions.map((option) => option.id))].sort((left, right) => left - right),
        [...uniquePoppedIds].sort((left, right) => left - right),
    );
});
