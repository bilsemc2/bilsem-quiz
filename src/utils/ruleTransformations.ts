// Matrix Puzzle System - Core Transformation Functions
// Temel dönüşüm fonksiyonları (rotation, scaling, color change, grid operations)

import {
    BaseShape,
} from '../types/matrixRules.ts';

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
