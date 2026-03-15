import assert from 'node:assert/strict';
import test from 'node:test';

import { canSelectPiece, getLevelConfigForIndex } from '../../../../src/components/Arcade/Games/ChromaHafiza/logic.ts';

test('getLevelConfigForIndex clamps to the first and last supported configs', () => {
    assert.deepEqual(getLevelConfigForIndex(-3), {
        id: 1,
        pieceCount: 4,
        colorCount: 2,
        previewDuration: 2000,
    });

    assert.deepEqual(getLevelConfigForIndex(0), {
        id: 1,
        pieceCount: 4,
        colorCount: 2,
        previewDuration: 2000,
    });

    assert.deepEqual(getLevelConfigForIndex(4), {
        id: 5,
        pieceCount: 16,
        colorCount: 4,
        previewDuration: 4000,
    });

    assert.deepEqual(getLevelConfigForIndex(9), {
        id: 5,
        pieceCount: 16,
        colorCount: 4,
        previewDuration: 4000,
    });
});

test('canSelectPiece rejects repeat taps and non-playing states', () => {
    assert.equal(
        canSelectPiece({
            gamePhase: 'playing',
            isResolving: false,
            piece: { isSelected: false },
        }),
        true,
    );

    assert.equal(
        canSelectPiece({
            gamePhase: 'playing',
            isResolving: false,
            piece: { isSelected: true },
        }),
        false,
    );

    assert.equal(
        canSelectPiece({
            gamePhase: 'reveal',
            isResolving: false,
            piece: { isSelected: false },
        }),
        false,
    );

    assert.equal(
        canSelectPiece({
            gamePhase: 'playing',
            isResolving: true,
            piece: { isSelected: false },
        }),
        false,
    );

    assert.equal(
        canSelectPiece({
            gamePhase: 'playing',
            isResolving: false,
            piece: null,
        }),
        false,
    );
});
