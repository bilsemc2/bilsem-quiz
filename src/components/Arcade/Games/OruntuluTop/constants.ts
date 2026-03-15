import type { BubbleColor, BubblePowerUp } from './types.ts';

export const GAME_CONFIG = {
    FRICTION: 0.998,
    BUBBLE_RADIUS: 22,
    ROW_HEIGHT: 22 * Math.sqrt(3),
    GRID_COLS: 12,
    GRID_ROWS: 10,
    SLINGSHOT_BOTTOM_OFFSET: 120,
    MAX_DRAG_DIST: 160,
    MIN_FORCE_MULT: 0.15,
    MAX_FORCE_MULT: 0.45,
    XP_COST: 35,
};

export const COLOR_CONFIG: Record<BubbleColor, { hex: string; points: number; label: string }> = {
    red: { hex: '#ef5350', points: 100, label: 'Kırmızı' },
    blue: { hex: '#42a5f5', points: 150, label: 'Mavi' },
    green: { hex: '#66bb6a', points: 200, label: 'Yeşil' },
    yellow: { hex: '#ffee58', points: 250, label: 'Sarı' },
    purple: { hex: '#ab47bc', points: 300, label: 'Mor' },
    orange: { hex: '#ffa726', points: 500, label: 'Turuncu' }
};

export const COLOR_KEYS: BubbleColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export const POWER_UP_CONFIG: Record<
    BubblePowerUp,
    { label: string; shortLabel: string; bonusPoints: number; badgeColor: string; textColor: string }
> = {
    star: {
        label: 'Yıldız Balon',
        shortLabel: 'Yıldız',
        bonusPoints: 250,
        badgeColor: '#facc15',
        textColor: '#111827',
    },
    heart: {
        label: 'Kalp Balon',
        shortLabel: 'Kalp',
        bonusPoints: 150,
        badgeColor: '#fb7185',
        textColor: '#ffffff',
    },
};
