
export enum GamePhase {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  QUIZ_PREP = 'QUIZ_PREP',
  QUIZZING = 'QUIZZING',
  RESULT = 'RESULT'
}

// Timing constants (F8: eliminate magic numbers)
export const TIMING = {
  QUIZ_PREP_DELAY_MS: 2000,    // Delay before quiz starts
  QUIZ_RESULT_DELAY_MS: 3500, // Delay after answer before showing result
  POWERUP_EXTEND_FRAMES: 600, // ~10 seconds at 60fps
  POWERUP_SLOW_FRAMES: 300,   // ~5 seconds at 60fps
} as const;

// Accessibility labels (F10)
export const A11Y = {
  CANVAS_LABEL: 'ChromaBreak oyun alanı - Mouse veya parmak ile paddle\'ı hareket ettirin',
  CANVAS_DESCRIPTION: 'Renkli blokları kırıp hafıza testi yapılan bir breakout oyunu',
} as const;

export enum PowerUpType {
  EXTEND = 'EXTEND',     // Paddle uzatma
  SLOW = 'SLOW',         // Top yavaşlatma
  SHRINK = 'SHRINK',     // Paddle küçültme (negatif)
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  active: boolean;
}

export interface Block {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  colorName: string;
  active: boolean;
  hasPowerUp?: PowerUpType;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export const COLORS = [
  { name: 'Kırmızı', hex: '#ef4444' },
  { name: 'Mavi', hex: '#3b82f6' },
  { name: 'Yeşil', hex: '#22c55e' },
  { name: 'Sarı', hex: '#eab308' },
  { name: 'Mor', hex: '#a855f7' },
  { name: 'Pembe', hex: '#ec4899' },
  { name: 'Turkuaz', hex: '#06b6d4' },
  { name: 'Turuncu', hex: '#f97316' }
];
