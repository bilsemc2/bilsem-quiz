import { MatrixRule } from '../../types/matrixRules';

/**
 * Kolay kurallar - Tek basit dönüşüm
 * Yeni kural eklemek için bu diziye ekleme yapın
 */
export const EASY_RULES: MatrixRule[] = [
    {
        id: 'rotation-90-cw',
        name: 'Saat Yönünde Döndürme',
        description: 'Her hücre saat yönünde 90° döner',
        direction: 'row',
        difficulty: 'easy',
        transformations: [{ type: 'rotate', degrees: 90 }],
    },
    {
        id: 'rotation-90-ccw',
        name: 'Ters Yönde Döndürme',
        description: 'Her hücre saat yönünün tersine 90° döner',
        direction: 'row',
        difficulty: 'easy',
        transformations: [{ type: 'rotate', degrees: -90 }],
    },
    {
        id: 'rotation-180',
        name: '180° Döndürme',
        description: 'Her hücre 180° döner',
        direction: 'row',
        difficulty: 'easy',
        transformations: [{ type: 'rotate', degrees: 180 }],
    },
    {
        id: 'scale-down',
        name: 'Boyut Küçülme',
        description: 'Her sütunda şekil küçülür',
        direction: 'row',
        difficulty: 'easy',
        transformations: [{ type: 'scale', factor: 0.8 }],
    },
    {
        id: 'stroke-increase',
        name: 'Çerçeve Kalınlaşma',
        description: 'Her sütunda çerçeve kalınlaşır',
        direction: 'row',
        difficulty: 'easy',
        transformations: [{ type: 'strokeIncrease', step: 2 }],
    },
    {
        id: 'bars-shift',
        name: 'Renkli Çubuklar Kaydırma',
        description: 'Renkli çubuklar her sütunda bir adım kayar',
        direction: 'row',
        difficulty: 'easy',
        transformations: [{ type: 'barsShift' }],
    },
    {
        id: 'bars-shift-vertical',
        name: 'Dikey Çubuklar Kaydırma',
        description: 'Dikey çubuklar her sütunda sağa kayar',
        direction: 'row',
        difficulty: 'easy',
        transformations: [{ type: 'barsShiftVertical' }],
    },
];
