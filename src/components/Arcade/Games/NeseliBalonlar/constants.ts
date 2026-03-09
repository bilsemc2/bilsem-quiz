import { ARCADE_PALETTE } from '../../Shared/ArcadeConstants.ts';
import type { BalloonColor } from './types.ts';

// ARCADE_PALETTE'den BalloonColor formatına dönüştür
// secondary: %30 karartılmış, highlight: %30 açıklaştırılmış
function hexToBalloonColor(name: string, hex: string): BalloonColor {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const darker = (v: number) => Math.max(0, Math.floor(v * 0.6));
    const lighter = (v: number) => Math.min(255, Math.floor(v + (255 - v) * 0.5));
    const toHex = (rv: number, gv: number, bv: number) =>
        `#${rv.toString(16).padStart(2, '0')}${gv.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`;
    return {
        name,
        primary: hex,
        secondary: toHex(darker(r), darker(g), darker(b)),
        highlight: toHex(lighter(r), lighter(g), lighter(b)),
    };
}

export const BALLOON_COLORS: BalloonColor[] = Object.values(ARCADE_PALETTE).map(
    c => hexToBalloonColor(c.name, c.hex)
);

export const MAX_BALLOONS = 8;
export const POP_DELAY = 1000;
export const GAME_ID = 'neseli-balonlar';
