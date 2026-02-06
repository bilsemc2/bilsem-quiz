// Matrix Puzzle System - Rule Executors
// Kuralları uygulayan fonksiyonlar

import {
    BaseShape,
    Transformation,
    MatrixRule,
    CANDY_COLORS,
} from '../types/matrixRules';

// ============================================
// TEMEL DÖNÜŞÜM FONKSİYONLARI
// ============================================

/**
 * Şekli belirtilen derece kadar döndürür
 */
export function applyRotation(shape: BaseShape, degrees: number): BaseShape {
    const newRotation = (shape.rotation + degrees) % 360;
    return {
        ...shape,
        rotation: newRotation < 0 ? newRotation + 360 : newRotation,
    };
}

/**
 * Şekli belirtilen eksende aynalar
 */
export function applyMirror(shape: BaseShape, axis: 'x' | 'y'): BaseShape {
    // İkiye bölünmüş şekiller için renkleri değiştir
    if (shape.isSplit) {
        if (axis === 'y' && shape.splitAxis === 'vertical') {
            return {
                ...shape,
                fillLeft: shape.fillRight,
                fillRight: shape.fillLeft,
            };
        }
    }

    // İç ızgara için aynalama
    if (shape.innerGrid) {
        const newCells = mirrorGrid(shape.innerGrid.cells, axis);
        return {
            ...shape,
            innerGrid: { ...shape.innerGrid, cells: newCells },
        };
    }

    return shape;
}

/**
 * 2D grid'i aynalar
 */
function mirrorGrid(cells: boolean[][], axis: 'x' | 'y'): boolean[][] {
    if (axis === 'y') {
        // Yatay ayna - her satırı ters çevir
        return cells.map(row => [...row].reverse());
    } else {
        // Dikey ayna - satırları ters sırala
        return [...cells].reverse();
    }
}

/**
 * Renk döngüsü uygular
 * GARANTILI: fillLeft ve fillRight asla aynı olmaz
 */
export function applyColorCycle(
    shape: BaseShape,
    step: number,
    colors: string[]
): BaseShape {
    if (!colors.length || colors.length < 2) return shape;

    const n = colors.length;

    // Sol renk için indeks hesapla
    const getLeftIndex = (): number => {
        if (shape.fillLeft) {
            const idx = colors.indexOf(shape.fillLeft);
            if (idx !== -1) return (idx + step) % n;
        }
        return step % n;
    };

    // Sağ renk için indeks hesapla (sol renkten farklı olacak şekilde)
    const getRightIndex = (leftIdx: number): number => {
        if (shape.fillRight) {
            const idx = colors.indexOf(shape.fillRight);
            if (idx !== -1) {
                const rightIdx = (idx + step) % n;
                // Eğer sol ile aynı olursa, bir sonraki rengi al
                return rightIdx === leftIdx ? (rightIdx + 1) % n : rightIdx;
            }
        }
        // Fallback: her zaman sol indeksten farklı
        return (leftIdx + 1) % n;
    };

    const leftIdx = getLeftIndex();
    const rightIdx = getRightIndex(leftIdx);

    return {
        ...shape,
        fill: shape.fill ? colors[(colors.indexOf(shape.fill) + step) % n] : undefined,
        fillLeft: shape.fillLeft ? colors[leftIdx] : undefined,
        fillRight: shape.fillRight ? colors[rightIdx] : undefined,
        innerGrid: shape.innerGrid ? {
            ...shape.innerGrid,
            cellColor: shape.innerGrid.cellColor
                ? colors[(colors.indexOf(shape.innerGrid.cellColor) + step) % n]
                : colors[step % n],
        } : undefined,
    };
}

/**
 * Sol ve sağ renkleri değiştirir
 */
export function applyColorSwap(shape: BaseShape): BaseShape {
    if (!shape.isSplit) return shape;
    return {
        ...shape,
        fillLeft: shape.fillRight,
        fillRight: shape.fillLeft,
    };
}

/**
 * Ölçek uygular
 */
export function applyScale(shape: BaseShape, factor: number): BaseShape {
    return {
        ...shape,
        scale: Math.max(0.3, Math.min(1.5, shape.scale * factor)),
    };
}

// ============================================
// İÇ IZGARA DÖNÜŞÜM FONKSİYONLARI
// ============================================

/**
 * İç ızgara satırlarını kaydırır
 */
export function applyGridRowShift(
    shape: BaseShape,
    direction: 'up' | 'down'
): BaseShape {
    if (!shape.innerGrid) return shape;

    const cells = [...shape.innerGrid.cells.map(row => [...row])];

    if (direction === 'down') {
        const lastRow = cells.pop()!;
        cells.unshift(lastRow);
    } else {
        const firstRow = cells.shift()!;
        cells.push(firstRow);
    }

    return {
        ...shape,
        innerGrid: { ...shape.innerGrid, cells },
    };
}

/**
 * İç ızgara sütunlarını kaydırır
 */
export function applyGridColShift(
    shape: BaseShape,
    direction: 'left' | 'right'
): BaseShape {
    if (!shape.innerGrid) return shape;

    const cells = shape.innerGrid.cells.map(row => {
        const newRow = [...row];
        if (direction === 'right') {
            const last = newRow.pop()!;
            newRow.unshift(last);
        } else {
            const first = newRow.shift()!;
            newRow.push(first);
        }
        return newRow;
    });

    return {
        ...shape,
        innerGrid: { ...shape.innerGrid, cells },
    };
}

/**
 * Belirli hücreleri açar/kapatır
 */
export function applyGridCellToggle(
    shape: BaseShape,
    positions: [number, number][]
): BaseShape {
    if (!shape.innerGrid) return shape;

    const cells = shape.innerGrid.cells.map(row => [...row]);

    positions.forEach(([row, col]) => {
        if (cells[row] && cells[row][col] !== undefined) {
            cells[row][col] = !cells[row][col];
        }
    });

    return {
        ...shape,
        innerGrid: { ...shape.innerGrid, cells },
    };
}

/**
 * Hücreleri kumulatif olarak sütun bazlı tersine çevirir
 * Step 0: orijinal
 * Step 1: 1. sütun (j=0) tersine
 * Step 2: 1. ve 2. sütun (j=0, j=1) tersine
 */
export function applyGridCellInvert(shape: BaseShape, step: number): BaseShape {
    if (!shape.innerGrid) return shape;

    const size = shape.innerGrid.size;
    const originalCells = shape.innerGrid.cells;
    const cells = originalCells.map(row => [...row]);

    if (step === 0) {
        // Step 0: Orijinal hücreler
        return shape;
    } else if (step === 1) {
        // Step 1: Hücreleri bir sağa kaydır (wrap around)
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const sourceJ = (j - 1 + size) % size;
                cells[i][j] = originalCells[i][sourceJ];
            }
        }
    } else if (step >= 2) {
        // Step 2: AND birleşimi - Step 0 ve Step 1'de ortak dolu hücreler
        // Step 1 = sağa kaydırılmış hali
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const step1J = (j - 1 + size) % size;
                const step0Value = originalCells[i][j];
                const step1Value = originalCells[i][step1J];
                cells[i][j] = step0Value && step1Value; // AND
            }
        }
    }

    return {
        ...shape,
        innerGrid: { ...shape.innerGrid, cells },
    };
}

/**
 * Adım bazlı kaydırma: Step 1 aşağı, Step 2 sağa
 */
export function applyGridShiftAlternating(shape: BaseShape, step: number): BaseShape {
    if (!shape.innerGrid) return shape;

    let result = shape;

    // Step 1: aşağı kaydır
    if (step >= 1) {
        result = applyGridRowShift(result, 'down');
    }

    // Step 2: sağa kaydır
    if (step >= 2) {
        result = applyGridColShift(result, 'right');
    }

    return result;
}

/**
 * İç ızgaranın kenar hücrelerini adım adım siler
 * Step 0: Orijinal
 * Step 1: Üst kenar silindi
 * Step 2: Üst + sağ kenar silindi
 * vb.
 */
export function applyGridEdgeDelete(shape: BaseShape, step: number): BaseShape {
    if (!shape.innerGrid) return shape;

    const size = shape.innerGrid.size;
    const cells = shape.innerGrid.cells.map(row => [...row]);

    // Her step'te farklı kenarları sil
    // Step 1: üst satır
    if (step >= 1) {
        for (let j = 0; j < size; j++) {
            cells[0][j] = false;
        }
    }

    // Step 2: sağ sütun
    if (step >= 2) {
        for (let i = 0; i < size; i++) {
            cells[i][size - 1] = false;
        }
    }

    return {
        ...shape,
        innerGrid: {
            ...shape.innerGrid,
            cells,
        },
    };
}

/**
 * İç ızgara hücrelerini çapraz yönde kaydırır
 * Her step'te hücreler sağ-alt çaprazda bir adım kayar
 */
export function applyGridDiagonalShift(shape: BaseShape, step: number): BaseShape {
    if (!shape.innerGrid) return shape;

    const size = shape.innerGrid.size;
    let cells = shape.innerGrid.cells.map(row => [...row]);

    // Her step için çapraz kaydırma uygula
    for (let s = 0; s < step; s++) {
        const newCells: boolean[][] = [];
        for (let i = 0; i < size; i++) {
            newCells[i] = new Array(size).fill(false);
        }

        // Her hücreyi sağ-alt çapraza kaydır (wrap around)
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (cells[i][j]) {
                    const newI = (i + 1) % size;
                    const newJ = (j + 1) % size;
                    newCells[newI][newJ] = true;
                }
            }
        }
        cells = newCells;
    }

    return {
        ...shape,
        innerGrid: {
            ...shape.innerGrid,
            cells,
        },
    };
}

/**
 * İç ızgarayı XOR operasyonu ile değiştirir
 * Her step'te köşegen hücreler ile XOR yapılır
 * Step 1: Ana köşegen XOR
 * Step 2: Ters köşegen XOR
 */
export function applyGridXOR(shape: BaseShape, step: number): BaseShape {
    if (!shape.innerGrid) return shape;

    const size = shape.innerGrid.size;
    const cells = shape.innerGrid.cells.map(row => [...row]);

    // Step 1: Ana köşegen ile XOR (sol üst - sağ alt)
    if (step >= 1) {
        for (let i = 0; i < size; i++) {
            cells[i][i] = !cells[i][i];
        }
    }

    // Step 2: Ters köşegen ile XOR (sağ üst - sol alt)
    if (step >= 2) {
        for (let i = 0; i < size; i++) {
            cells[i][size - 1 - i] = !cells[i][size - 1 - i];
        }
    }

    return {
        ...shape,
        innerGrid: {
            ...shape.innerGrid,
            cells,
        },
    };
}

/**
 * Renkli çubukları aşağı kaydırır
 * Her step'te offset 1 artar
 */
export function applyBarsShift(shape: BaseShape, step: number): BaseShape {
    if (!shape.coloredBars) return shape;

    return {
        ...shape,
        coloredBars: {
            ...shape.coloredBars,
            offset: step,
        },
    };
}

/**
 * İç ızgarayı döndürür
 */
export function applyGridRotate(shape: BaseShape, degrees: number): BaseShape {
    if (!shape.innerGrid) return shape;

    const size = shape.innerGrid.size;
    let cells = shape.innerGrid.cells.map(row => [...row]);

    const rotations = ((degrees % 360) + 360) % 360 / 90;

    for (let r = 0; r < rotations; r++) {
        const newCells: boolean[][] = [];
        for (let i = 0; i < size; i++) {
            newCells[i] = [];
            for (let j = 0; j < size; j++) {
                newCells[i][j] = cells[size - 1 - j][i];
            }
        }
        cells = newCells;
    }

    return {
        ...shape,
        innerGrid: { ...shape.innerGrid, cells },
    };
}

// ============================================
// ANA DÖNÜŞÜM UYGULAYICI
// ============================================

/**
 * Tek bir dönüşümü uygular
 */
export function applySingleTransformation(
    shape: BaseShape,
    transformation: Transformation,
    step: number = 1
): BaseShape {
    switch (transformation.type) {
        case 'rotate':
            return applyRotation(shape, transformation.degrees * step);

        case 'mirror':
            // Mirror her adımda toggle olur
            return step % 2 === 1 ? applyMirror(shape, transformation.axis) : shape;

        case 'scale':
            return applyScale(shape, Math.pow(transformation.factor, step));

        case 'colorCycle':
            return applyColorCycle(shape, step, transformation.colors);

        case 'colorSwap':
            return step % 2 === 1 ? applyColorSwap(shape) : shape;

        case 'strokeIncrease':
            // İlk sütunda 1px, sonra her sütunda step kadar artar
            const baseStrokeWidth = 1;
            return {
                ...shape,
                strokeWidth: Math.min(baseStrokeWidth + transformation.step * step, 8),
                strokeColor: shape.strokeColor || '#333333',
            };

        case 'gridRowShift':
            let rowResult = shape;
            for (let i = 0; i < step; i++) {
                rowResult = applyGridRowShift(rowResult, transformation.direction);
            }
            return rowResult;

        case 'gridColShift':
            let colResult = shape;
            for (let i = 0; i < step; i++) {
                colResult = applyGridColShift(colResult, transformation.direction);
            }
            return colResult;

        case 'gridCellToggle':
            return step % 2 === 1
                ? applyGridCellToggle(shape, transformation.positions)
                : shape;

        case 'gridRotate':
            return applyGridRotate(shape, transformation.degrees * step);

        case 'gridCellInvert':
            return applyGridCellInvert(shape, step);

        case 'gridShiftAlternating':
            return applyGridShiftAlternating(shape, step);

        case 'gridEdgeDelete':
            return applyGridEdgeDelete(shape, step);

        case 'gridDiagonalShift':
            return applyGridDiagonalShift(shape, step);

        case 'gridXOR':
            return applyGridXOR(shape, step);

        case 'barsShift':
            return applyBarsShift(shape, step);

        case 'barsShiftVertical':
            return applyBarsShift(shape, step); // Aynı mantık, sadece ShapeRenderer'da yön farklı

        default:
            return shape;
    }
}

/**
 * Bir kuraldaki tüm dönüşümleri sırayla uygular
 */
export function applyRule(
    shape: BaseShape,
    rule: MatrixRule,
    step: number
): BaseShape {
    let result = shape;

    for (const transformation of rule.transformations) {
        result = applySingleTransformation(result, transformation, step);
    }

    return result;
}

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

// ============================================
// 3x3 MATRİS ÜRETİCİ
// ============================================

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

