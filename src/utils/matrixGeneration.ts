// Matrix Puzzle System - Matrix Generation and Validation
// Matris üretimi, görsel eşdeğerlik kontrolü ve yanlış seçenek üretimi

import {
    BaseShape,
    MatrixRule,
    CANDY_COLORS,
} from '../types/matrixRules.ts';

import {
    applyRotation,
    applyMirror,
    applyScale,
    applyColorSwap,
    applyGridRowShift,
    applyGridColShift,
    applyGridCellToggle,
} from './ruleTransformations.ts';

import { applyRule } from './ruleApplication.ts';

// ============================================
// ŞEKİL ÜRETİCİLER
// ============================================

/**
 * Renkli çubuklu şekil üretir
 */
export function generateBarsShape(): BaseShape {
    const id = Math.random().toString(36).substr(2, 9);
    const safeColors = CANDY_COLORS.slice(0, 6);

    // 3 farklı renkli çubuk seç
    const shuffledColors = [...safeColors].sort(() => Math.random() - 0.5);
    const barColors = shuffledColors.slice(0, 3);

    return {
        id,
        type: 'rectangle',
        rotation: 0,
        scale: 1,
        fill: '#1e293b', // Koyu arka plan
        coloredBars: {
            colors: barColors,
            offset: 0,
            orientation: 'horizontal',
        },
    };
}

/**
 * Dikey renkli çubuklu şekil üretir
 */
export function generateVerticalBarsShape(): BaseShape {
    const id = Math.random().toString(36).substr(2, 9);
    const safeColors = CANDY_COLORS.slice(0, 6);

    // 3 farklı renkli çubuk seç
    const shuffledColors = [...safeColors].sort(() => Math.random() - 0.5);
    const barColors = shuffledColors.slice(0, 3);

    return {
        id,
        type: 'rectangle',
        rotation: 0,
        scale: 1,
        fill: '#1e293b', // Koyu arka plan
        coloredBars: {
            colors: barColors,
            offset: 0,
            orientation: 'vertical',
        },
    };
}

/**
 * Rastgele başlangıç şekli üretir
 * NOT: Sadece ilk 6 rengi kullan - colorCycle uyumluluğu için
 */
export function generateRandomShape(useInnerGrid: boolean = false): BaseShape {
    const id = Math.random().toString(36).substr(2, 9);
    // Sadece ilk 6 rengi kullan - tüm colorCycle kurallarıyla uyumlu
    const safeColors = CANDY_COLORS.slice(0, 6);

    if (useInnerGrid) {
        const size = Math.random() > 0.5 ? 3 : 4;
        const cells: boolean[][] = [];

        for (let i = 0; i < size; i++) {
            cells[i] = [];
            for (let j = 0; j < size; j++) {
                cells[i][j] = Math.random() > 0.5;
            }
        }

        return {
            id,
            type: 'grid',
            rotation: 0,
            scale: 1,
            innerGrid: {
                size: size as 3 | 4,
                cells,
                cellColor: safeColors[Math.floor(Math.random() * safeColors.length)],
            },
        };
    }

    const types: Array<'rectangle' | 'circle' | 'triangle' | 'diamond'> =
        ['rectangle', 'circle', 'triangle', 'diamond'];

    // Her zaman iki renk kullan (split) - görsel çeşitlilik için
    const color1 = safeColors[Math.floor(Math.random() * safeColors.length)];
    const remainingColors = safeColors.filter(c => c !== color1);
    const color2 = remainingColors[Math.floor(Math.random() * remainingColors.length)];

    return {
        id,
        type: types[Math.floor(Math.random() * types.length)],
        rotation: 0,
        scale: 1,
        isSplit: true, // Her zaman split
        splitAxis: 'vertical',
        fillLeft: color1,
        fillRight: color2,
    };
}

// ============================================
// 3x3 MATRİS ÜRETİCİ
// ============================================

/**
 * 3x3 matris üretir
 */
export function generateMatrix(
    rules: MatrixRule[],
    useInnerGrid: boolean = false
): BaseShape[][] {
    const matrix: BaseShape[][] = [];

    // Kuralın barsShift kullanıp kullanmadığını kontrol et
    const usesBars = rules.some(r =>
        r.transformations.some(t => t.type === 'barsShift')
    );
    const usesVerticalBars = rules.some(r =>
        r.transformations.some(t => t.type === 'barsShiftVertical')
    );

    // İlk sütunu başlangıç şekilleri ile doldur
    for (let row = 0; row < 3; row++) {
        matrix[row] = [];
        if (usesVerticalBars) {
            matrix[row][0] = generateVerticalBarsShape();
        } else if (usesBars) {
            matrix[row][0] = generateBarsShape();
        } else {
            matrix[row][0] = generateRandomShape(useInnerGrid);
        }
    }

    // Her satır için kuralları uygula
    for (let row = 0; row < 3; row++) {
        const rowRule = rules.find(r => r.direction === 'row') || rules[0];

        for (let col = 1; col < 3; col++) {
            matrix[row][col] = applyRule(matrix[row][0], rowRule, col);
            matrix[row][col] = { ...matrix[row][col], id: Math.random().toString(36).substr(2, 9) };
        }
    }

    return matrix;
}

// ============================================
// GÖRSEL EŞDEĞERLİK KONTROLÜ
// ============================================

/**
 * Şeklin döndürme simetrisi (derece cinsinden)
 *
 * ÖNEMLİ: Split şekillerde (isSplit=true) rotasyon simetrisi YOKTUR (360°)
 * çünkü renkler şekille birlikte döner ve her açıda farklı görünür.
 */
function getRotationalSymmetry(type: string, isSplit?: boolean): number {
    // Split şekillerde simetri yok - renkler her açıda farklı konumda
    if (isSplit) {
        return 360;
    }

    switch (type) {
        case 'circle':
            return 1; // Her açıda aynı görünür (sadece tek renk ise)
        case 'rectangle':
            return 90; // 90° simetri (kare varsayalım)
        case 'hexagon':
        case 'star':
            return 60; // 6-katlı simetri
        case 'diamond':
            return 180; // 180° simetri
        case 'triangle':
            return 120; // Eşkenar üçgen 3-katlı simetri
        case 'grid':
            return 90; // Kare ızgara 90° simetri
        default:
            return 360; // Simetri yok
    }
}

/**
 * Normalize edilmiş rotasyon değeri (simetri dikkate alınarak)
 */
function getNormalizedRotation(rotation: number, symmetry: number): number {
    if (symmetry === 1) return 0; // Tek renkli daire için rotasyon önemsiz
    const normalizedRot = ((rotation % 360) + 360) % 360;
    return normalizedRot % symmetry;
}

/**
 * İki iç ızgaranın görsel olarak eşit olup olmadığını kontrol eder
 */
function areInnerGridsVisuallyEqual(
    grid1: { size: number; cells: boolean[][]; cellColor?: string } | undefined,
    grid2: { size: number; cells: boolean[][]; cellColor?: string } | undefined
): boolean {
    if (!grid1 && !grid2) return true;
    if (!grid1 || !grid2) return false;
    if (grid1.size !== grid2.size) return false;
    if (grid1.cellColor !== grid2.cellColor) return false;

    // Hücreleri karşılaştır
    for (let i = 0; i < grid1.size; i++) {
        for (let j = 0; j < grid1.size; j++) {
            if (grid1.cells[i][j] !== grid2.cells[i][j]) return false;
        }
    }
    return true;
}

/**
 * İki şeklin GÖRSEL OLARAK aynı olup olmadığını kontrol eder
 * Döndürme simetrisi dikkate alınır (split şekiller için simetri yok)
 */
export function areShapesVisuallyEqual(shape1: BaseShape, shape2: BaseShape): boolean {
    // Tip farklıysa kesinlikle farklı
    if (shape1.type !== shape2.type) return false;

    // Döndürme simetrisini al (split şekiller için 360 = simetri yok)
    const symmetry = getRotationalSymmetry(shape1.type, shape1.isSplit || shape2.isSplit);

    // Normalize edilmiş rotasyonları karşılaştır
    const rot1 = getNormalizedRotation(shape1.rotation, symmetry);
    const rot2 = getNormalizedRotation(shape2.rotation, symmetry);
    if (rot1 !== rot2) return false;

    // Ölçeği karşılaştır
    if (Math.abs(shape1.scale - shape2.scale) > 0.01) return false;

    // Renkleri karşılaştır
    if (shape1.isSplit !== shape2.isSplit) return false;

    if (shape1.isSplit && shape2.isSplit) {
        if (shape1.fillLeft !== shape2.fillLeft) return false;
        if (shape1.fillRight !== shape2.fillRight) return false;
    } else {
        if (shape1.fill !== shape2.fill) return false;
    }

    // İç ızgaraları karşılaştır
    if (!areInnerGridsVisuallyEqual(shape1.innerGrid, shape2.innerGrid)) return false;

    return true;
}

/**
 * Yanlış seçenek üretir (doğru cevaba benzer AMA GÖRSEL OLARAK FARKLI)
 */
export function generateWrongOption(
    correctShape: BaseShape,
    existingOptions: BaseShape[]
): BaseShape {
    // Şekil tipine göre uygun modifikasyonları seç
    const shapeType = correctShape.type;
    // Split veya innerGrid varsa simetri yok (her açı farklı)
    const hasVisualContent = correctShape.isSplit || !!correctShape.innerGrid;
    const symmetry = getRotationalSymmetry(shapeType, hasVisualContent);

    const modifications: Array<(s: BaseShape) => BaseShape> = [];

    // ÖNCELİK 1: Renk değişikliği - her zaman görsel fark oluşturur (en güvenilir)
    modifications.push(
        (s) => {
            const otherColors = CANDY_COLORS.filter(c =>
                c !== s.fill && c !== s.fillLeft && c !== s.fillRight
            );
            const newColor = otherColors[existingOptions.length % otherColors.length];
            if (s.isSplit) {
                return { ...s, fillLeft: newColor };
            }
            return { ...s, fill: newColor };
        },
        (s) => {
            const otherColors = CANDY_COLORS.filter(c =>
                c !== s.fill && c !== s.fillLeft && c !== s.fillRight
            );
            const newColor = otherColors[(existingOptions.length + 1) % otherColors.length];
            if (s.isSplit) {
                return { ...s, fillRight: newColor };
            }
            return { ...s, fill: newColor };
        }
    );

    // ÖNCELİK 2: Ölçek değişikliği - görsel fark için güvenilir
    modifications.push(
        (s) => applyScale(s, 0.7),
        (s) => applyScale(s, 0.6)
    );

    // ÖNCELİK 3: Aynalama - sadece split shapes için anlamlı
    if (correctShape.isSplit) {
        modifications.push(
            (s) => applyMirror(s, 'y'),
            (s) => applyColorSwap(s)
        );
    }

    // ÖNCELİK 4 (EN SON): Döndürme - sadece asimetrik şekiller için
    // NOT: Rotasyon kurallarında bu seçenek grid'deki diğer hücrelerle çakışabilir!
    if (hasVisualContent || symmetry > 90) {
        modifications.push((s) => applyRotation(s, 90));
    }
    if (symmetry > 180) {
        modifications.push((s) => applyRotation(s, 180));
    }

    // İç ızgara varsa: HÜCRE KAYDIRMA GARNATİLİ FARK OLUŞTURUR
    if (correctShape.innerGrid) {
        // Mevcut seçenek sayısına göre farklı kaydırma yönleri
        const optionCount = existingOptions.length;
        modifications.length = 0; // Diğer modifikasyonları temizle

        // Her seçenek için farklı kaydırma
        switch (optionCount % 4) {
            case 0:
                modifications.push((s) => applyGridRowShift(s, 'down'));
                break;
            case 1:
                modifications.push((s) => applyGridColShift(s, 'right'));
                break;
            case 2:
                modifications.push((s) => applyGridRowShift(s, 'up'));
                break;
            case 3:
                modifications.push((s) => applyGridColShift(s, 'left'));
                break;
        }
        // Ekstra güvenlik: hücre toggle
        modifications.push((s) => applyGridCellToggle(s, [[optionCount % 3, optionCount % 3]]));
    }

    // Eğer hiç modifikasyon yoksa (çok nadir), farklı bir şekil tipi üret
    if (modifications.length === 0) {
        const types: Array<'rectangle' | 'triangle' | 'diamond'> =
            ['rectangle', 'triangle', 'diamond'];
        const differentType = types.find(t => t !== shapeType) || 'triangle';
        modifications.push((s) => ({ ...s, type: differentType }));
    }

    // Rastgele bir modifikasyon seç ve uygula
    let attempts = 0;
    let wrongShape: BaseShape;
    const maxAttempts = 20; // Azaltıldı - performans için

    do {
        // Her seferinde farklı modifikasyon indeksi kullan
        const modIndex = (attempts + existingOptions.length) % modifications.length;
        const mod = modifications[modIndex];
        wrongShape = mod({ ...correctShape, id: Math.random().toString(36).substr(2, 9) });
        attempts++;

        // İkinci modifikasyon ekle (güvenlik için)
        if (attempts > 5) {
            const mod2Index = (modIndex + 1) % modifications.length;
            wrongShape = modifications[mod2Index](wrongShape);
        }
    } while (
        attempts < maxAttempts &&
        (
            areShapesVisuallyEqual(wrongShape, correctShape) ||
            existingOptions.some(opt => areShapesVisuallyEqual(opt, wrongShape))
        )
    );

    // Son çare: farklı renk zorla (her zaman farklı olacak şekilde)
    if (attempts >= maxAttempts || areShapesVisuallyEqual(wrongShape, correctShape)) {
        const colorIndex = existingOptions.length % CANDY_COLORS.length;
        const newColor = CANDY_COLORS[(colorIndex + 2) % CANDY_COLORS.length];
        wrongShape = {
            ...wrongShape,
            id: Math.random().toString(36).substr(2, 9),
            fill: correctShape.isSplit ? undefined : newColor,
            fillLeft: correctShape.isSplit ? newColor : undefined,
            rotation: (correctShape.rotation + 90 * existingOptions.length) % 360,
        };
    }

    return wrongShape;
}
