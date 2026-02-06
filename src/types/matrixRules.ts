// Matrix Puzzle System - Type Definitions
// 3x3 ızgara tabanlı kural sistemi için tip tanımları

// ============================================
// RENK PALETİ - 3D Gummy Candy Estetiği
// ============================================

export const CANDY_COLORS = [
    '#E63946', // Canlı Kırmızı
    '#2A9D8F', // Koyu Deniz Yeşili
    '#F4D03F', // Parlak Sarı
    '#7B3FF2', // Mor
    '#1A73E8', // Google Mavisi
    '#FF6F00', // Koyu Turuncu
] as const;

// ============================================
// TEMEL ŞEKİL TİPLERİ
// ============================================

export type ShapeType =
    | 'rectangle'
    | 'circle'
    | 'triangle'
    | 'star'
    | 'diamond'
    | 'hexagon'
    | 'grid';    // İç ızgara

export interface InnerGrid {
    size: 3 | 4;           // 3x3 veya 4x4 iç ızgara
    cells: boolean[][];    // Her hücre dolu/boş
    cellColor?: string;    // Dolu hücrelerin rengi
}

export interface BaseShape {
    id: string;
    type: ShapeType;

    // Renk seçenekleri
    fill?: string;                // Tek renk dolgu
    fillLeft?: string;            // Sol yarı rengi (bölünmüş için)
    fillRight?: string;           // Sağ yarı rengi

    // Dönüşüm
    rotation: number;             // 0, 90, 180, 270
    scale: number;                // 0.5 - 1.5

    // İç ızgara (type: 'grid' için)
    innerGrid?: InnerGrid;

    // Ek özellikler
    strokeColor?: string;         // Çerçeve rengi
    strokeWidth?: number;         // Çerçeve kalınlığı (0-6)
    isSplit?: boolean;            // İkiye bölünmüş mü
    splitAxis?: 'vertical' | 'horizontal';

    // Renkli çubuklar (şeklin içinde)
    coloredBars?: {
        colors: string[];                    // Çubuk renkleri
        offset: number;                      // Kaydırma miktarı (0, 1, 2...)
        orientation?: 'horizontal' | 'vertical'; // Çubuk yönü (varsayılan: horizontal)
    };
}

// ============================================
// DÖNÜŞÜM TİPLERİ
// ============================================

export type Transformation =
    // Temel dönüşümler
    | { type: 'rotate'; degrees: 90 | 180 | 270 | -90 }
    | { type: 'mirror'; axis: 'x' | 'y' }
    | { type: 'scale'; factor: number }

    // Renk dönüşümleri
    | { type: 'colorCycle'; colors: string[] }
    | { type: 'colorSwap' }                       // Sol-sağ renk değişimi
    | { type: 'colorInvert' }                     // Renkleri tersine çevir
    | { type: 'strokeIncrease'; step: number }    // Her adımda çerçeve kalınlaşır

    // İç ızgara dönüşümleri
    | { type: 'gridRowShift'; direction: 'up' | 'down' }
    | { type: 'gridColShift'; direction: 'left' | 'right' }
    | { type: 'gridCellToggle'; positions: [number, number][] }
    | { type: 'gridRotate'; degrees: 90 | 180 | 270 }
    | { type: 'gridCellInvert' }  // Hücreleri adım adım tersine çevir
    | { type: 'gridShiftAlternating' }  // Step 1: aşağı, Step 2: sağa
    | { type: 'gridEdgeDelete' }  // Her adımda kenar hücreleri silinir
    | { type: 'gridDiagonalShift' }  // Hücreler çapraz yönde kayar
    | { type: 'gridXOR' }  // Hücreler XOR ile değiştirilir

    // Çubuk dönüşümleri
    | { type: 'barsShift' }  // Renkli çubuklar aşağı kayar
    | { type: 'barsShiftVertical' }  // Dikey çubuklar sağa kayar

    // Dolgu dönüşümleri
    | { type: 'fillPattern'; pattern: 'solid' | 'empty' | 'striped' | 'dotted' };

// ============================================
// KURAL TİPLERİ
// ============================================

export type RuleDirection = 'row' | 'column' | 'diagonal';
export type RuleDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface MatrixRule {
    id: string;
    name: string;                        // Türkçe isim
    description: string;                  // Açıklama
    direction: RuleDirection;             // Satır, sütun veya çapraz
    difficulty: RuleDifficulty;
    transformations: Transformation[];    // Uygulanacak dönüşümler

    // Opsiyonel: Başlangıç şekli üretici
    initialShapeGenerator?: () => BaseShape;
}

// ============================================
// OYUN DURUMU
// ============================================

export interface MatrixCell {
    row: number;
    col: number;
    shape: BaseShape;
    isHidden: boolean;                   // Gizli mi (soru hücresi)
}

export interface MatrixGrid {
    cells: MatrixCell[][];               // 3x3 ızgara
    hiddenCell: { row: number; col: number };
    appliedRules: MatrixRule[];          // Uygulanan kurallar
}

export interface GameOption {
    id: string;
    shape: BaseShape;
    isCorrect: boolean;
}

export interface MatrixQuestion {
    grid: MatrixGrid;
    options: GameOption[];               // 5 seçenek
    correctAnswer: BaseShape;
    level: number;
    timeGenerated: number;
}

// ============================================
// OYUN İSTATİSTİKLERİ
// ============================================

export interface GameStats {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    avgResponseTime: number;
    rulesEncountered: string[];          // Karşılaşılan kural ID'leri
}
