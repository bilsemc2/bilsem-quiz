import { LEVEL_CONFIGS } from './constants.ts';
import type { GamePhase, LevelConfig, PuzzlePiece } from './types.ts';
import { generatePuzzlePieces } from './utils/patternGenerator.ts';

export const getLevelConfigForIndex = (levelIdx: number): LevelConfig => {
    const normalizedIndex = Number.isFinite(levelIdx) ? Math.max(0, Math.floor(levelIdx)) : 0;

    return LEVEL_CONFIGS[Math.min(normalizedIndex, LEVEL_CONFIGS.length - 1)];
};

export interface ChromaHafizaRoundState {
    config: LevelConfig;
    pieces: PuzzlePiece[];
    targetColor: string;
}

export const createRoundState = (
    levelIdx: number,
    random: () => number = Math.random,
): ChromaHafizaRoundState => {
    const config = getLevelConfigForIndex(levelIdx);
    const pieces = generatePuzzlePieces(config.pieceCount, config.colorCount);
    const distinctColors = Array.from(new Set(pieces.map((piece) => piece.targetColor)));
    const targetColor = distinctColors[Math.floor(random() * distinctColors.length)] ?? '';

    return {
        config,
        pieces,
        targetColor,
    };
};

interface CanSelectPieceOptions {
    gamePhase: GamePhase;
    isResolving: boolean;
    piece?: Pick<PuzzlePiece, 'isSelected'> | null;
}

export const canSelectPiece = ({
    gamePhase,
    isResolving,
    piece,
}: CanSelectPieceOptions): boolean => (
    gamePhase === 'playing' &&
    !isResolving &&
    piece?.isSelected === false
);
