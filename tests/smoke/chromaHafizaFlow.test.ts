import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { canSelectPiece, createRoundState } from '../../src/components/Arcade/Games/ChromaHafiza/logic.ts';

test('chroma hafiza smoke covers route, catalog and a playable round', () => {
    const routeSource = readFileSync(new URL('../../src/routes/arcadeRoutes.tsx', import.meta.url), 'utf8');
    const catalogSource = readFileSync(new URL('../../src/data/arcade/games.tsx', import.meta.url), 'utf8');

    assert.match(routeSource, /path="\/bilsem-zeka\/chroma-hafiza"/);
    assert.match(catalogSource, /id:\s*'chroma-hafiza'/);
    assert.match(catalogSource, /link:\s*"\/bilsem-zeka\/chroma-hafiza"/);

    const round = createRoundState(0, () => 0);
    const targetPieces = round.pieces.filter((piece) => piece.targetColor === round.targetColor);

    assert.equal(round.config.id, 1);
    assert.equal(round.pieces.length, round.config.pieceCount);
    assert.ok(round.targetColor.length > 0);
    assert.ok(targetPieces.length > 0);
    assert.equal(
        canSelectPiece({
            gamePhase: 'playing',
            isResolving: false,
            piece: targetPieces[0],
        }),
        true,
    );
});

test('chroma hafiza smoke keeps late levels on the max difficulty band', () => {
    const round = createRoundState(12, () => 0.5);
    const alreadySelectedPiece = {
        ...round.pieces[0],
        isSelected: true,
    };

    assert.equal(round.config.id, 5);
    assert.equal(round.pieces.length, 16);
    assert.equal(round.config.colorCount, 4);
    assert.equal(
        canSelectPiece({
            gamePhase: 'playing',
            isResolving: false,
            piece: alreadySelectedPiece,
        }),
        false,
    );
});
