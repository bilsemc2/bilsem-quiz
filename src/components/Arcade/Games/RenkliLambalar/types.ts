import type { ArcadeColorId } from '../../Shared/ArcadeConstants.ts';

// ColorType artık ArcadeColorId'den türetilir (sadece oyunun kullandığı 4 renk)
export type ColorType = Extract<ArcadeColorId, 'red' | 'blue' | 'yellow' | 'green'>;

export interface Cell {
    id: number;
    color: ColorType;
    hex: string;
    isRevealed: boolean;
    isError: boolean;
}

export type GamePhase = 'idle' | 'memorizing' | 'playing' | 'revealing' | 'game_over' | 'victory';
