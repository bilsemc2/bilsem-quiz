// Matrix Puzzle System - Orta Zorluk Kuralları
// Seviye 6-10 için kombinasyonlar ve iç ızgara

import { MatrixRule } from '../../types/matrixRules';

/**
 * Orta zorluk kuralları - Basit kombinasyonlar + iç ızgara başlangıcı
 * NOT: Toggle operasyonları (colorSwap, mirror) kullanma - 3 sütunda sorun çıkarır
 */
export const MEDIUM_RULES: MatrixRule[] = [
    {
        id: 'rotation-270',
        name: '270° Döndürme',
        description: 'Her hücre 270° (ters yönde 90°) döner',
        direction: 'row',
        difficulty: 'medium',
        transformations: [{ type: 'rotate', degrees: 270 }],
    },
    {
        id: 'grid-row-shift',
        name: 'Dikey Kaydırma',
        description: 'İç ızgara satırları aşağı kayar (yukarı-aşağı)',
        direction: 'row',
        difficulty: 'medium',
        transformations: [{ type: 'gridRowShift', direction: 'down' }],
    },
    {
        id: 'grid-col-shift',
        name: 'Yatay Kaydırma',
        description: 'İç ızgara hücreleri sola kayar (sağa-sola)',
        direction: 'row',
        difficulty: 'medium',
        transformations: [{ type: 'gridColShift', direction: 'left' }],
    },
    {
        id: 'grid-edge-delete',
        name: 'Kenar Silme',
        description: 'Her adımda kenar hücreleri silinir',
        direction: 'row',
        difficulty: 'medium',
        transformations: [{ type: 'gridEdgeDelete' }],
    },
    {
        id: 'grid-diagonal-shift',
        name: 'Çapraz Kaydırma',
        description: 'Hücreler çapraz yönde kayar',
        direction: 'row',
        difficulty: 'medium',
        transformations: [{ type: 'gridDiagonalShift' }],
    },
];
