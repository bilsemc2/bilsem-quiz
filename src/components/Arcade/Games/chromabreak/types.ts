
export enum GamePhase {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  QUIZ_PREP = 'QUIZ_PREP',
  QUIZZING = 'QUIZZING',
  RESULT = 'RESULT'
}

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
