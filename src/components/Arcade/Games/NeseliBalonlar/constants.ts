import { BalloonColor } from './types';

export const BALLOON_COLORS: BalloonColor[] = [
    { name: 'Kırmızı', primary: '#ef4444', secondary: '#991b1b', highlight: '#fca5a5' },
    { name: 'Mavi', primary: '#3b82f6', secondary: '#1e3a8a', highlight: '#93c5fd' },
    { name: 'Yeşil', primary: '#22c55e', secondary: '#14532d', highlight: '#86efac' },
    { name: 'Sarı', primary: '#eab308', secondary: '#713f12', highlight: '#fde047' },
    { name: 'Mor', primary: '#a855f7', secondary: '#581c87', highlight: '#d8b4fe' },
    { name: 'Turuncu', primary: '#f97316', secondary: '#7c2d12', highlight: '#fdba74' },
    { name: 'Pembe', primary: '#ec4899', secondary: '#831843', highlight: '#f9a8d4' },
    { name: 'Turkuaz', primary: '#06b6d4', secondary: '#164e63', highlight: '#67e8f9' },
];

export const MAX_BALLOONS = 8;
export const POP_DELAY = 1000;
export const GAME_ID = 'neseli-balonlar';
