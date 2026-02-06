// Matrix Puzzle System - Zor Kurallar
// Seviye 11-15 için çoklu dönüşümler

import { MatrixRule } from '../../types/matrixRules';

/**
 * Zor kurallar - İkili ve üçlü kombinasyonlar
 * NOT: Toggle operasyonları (colorSwap, mirror) kullanma - 3 sütunda sorun çıkarır
 */
export const HARD_RULES: MatrixRule[] = [
    {
        id: 'rotation-scale',
        name: 'Döndür + Küçült',
        description: '90° döndür + boyut küçült',
        direction: 'row',
        difficulty: 'hard',
        transformations: [
            { type: 'rotate', degrees: 90 },
            { type: 'scale', factor: 0.85 },
        ],
    },
    {
        id: 'grid-rotate-90',
        name: 'İç Izgara Döndürme',
        description: 'İç ızgara 90° döner',
        direction: 'row',
        difficulty: 'hard',
        transformations: [{ type: 'gridRotate', degrees: 90 }],
    },
    {
        id: 'grid-shift-both',
        name: 'Çift Yönlü Kaydırma',
        description: '2.sütun: aşağı, 3.sütun: sağa',
        direction: 'row',
        difficulty: 'hard',
        transformations: [
            { type: 'gridShiftAlternating' },
        ],
    },
    {
        id: 'grid-cell-invert',
        name: 'Hücre Tersine Çevirme',
        description: 'Hücreler adım adım tersine döner',
        direction: 'row',
        difficulty: 'hard',
        transformations: [{ type: 'gridCellInvert' }],
    },
    {
        id: 'grid-xor',
        name: 'XOR Operasyonu',
        description: 'Köşegen hücreler XOR ile değişir',
        direction: 'row',
        difficulty: 'hard',
        transformations: [{ type: 'gridXOR' }],
    },
];
