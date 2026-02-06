// Matrix Puzzle System - Uzman Kurallar
// Seviye 16-20 için en karmaşık dönüşümler

import { MatrixRule } from '../../types/matrixRules';

/**
 * Uzman kuralları - Mantıksal kombinasyonlar
 * NOT: Toggle operasyonları (colorSwap, mirror) kullanma - 3 sütunda sorun çıkarır
 * NOT: colorCycle kullanma - tahmin gerektirir, mantıksal değil
 */
export const EXPERT_RULES: MatrixRule[] = [
    {
        id: 'complex-grid-rotate',
        name: 'Karmaşık Izgara Dönüşümü',
        description: '90° döndür + ızgara 90° döndür',
        direction: 'row',
        difficulty: 'expert',
        transformations: [
            { type: 'rotate', degrees: 90 },
            { type: 'gridRotate', degrees: 90 },
        ],
    },
    {
        id: 'scale-grid-shift',
        name: 'Boyut + Izgara Kaydırma',
        description: 'Küçült + satır aşağı kaydır',
        direction: 'row',
        difficulty: 'expert',
        transformations: [
            { type: 'scale', factor: 0.8 },
            { type: 'gridRowShift', direction: 'down' },
        ],
    },
    {
        id: 'rotation-grid-both',
        name: 'Çift Dönüşüm',
        description: '180° döndür + ızgara sütun kaydır',
        direction: 'row',
        difficulty: 'expert',
        transformations: [
            { type: 'rotate', degrees: 180 },
            { type: 'gridColShift', direction: 'right' },
        ],
    },
    {
        id: 'grid-invert-rotate',
        name: 'Izgara Ters + Döndür',
        description: 'Hücre tersine çevir + 90° döndür',
        direction: 'row',
        difficulty: 'expert',
        transformations: [
            { type: 'gridCellInvert' },
            { type: 'rotate', degrees: 90 },
        ],
    },
];
