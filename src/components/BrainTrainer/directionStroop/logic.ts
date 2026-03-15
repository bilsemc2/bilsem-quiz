export const GAME_ID = "yon-stroop";
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_CORRECT_MS = 800;
export const FEEDBACK_DURATION_WRONG_MS = 1000;

export interface DirectionStroopRound {
  word: string;
  position: "left" | "right" | "top" | "bottom";
  correctAnswer: string;
}

export interface GridPos {
  row: number;
  col: number;
}

export const DIRECTIONS = [
  { word: "SOL", position: "left" as const, turkishName: "Sol" },
  { word: "SAĞ", position: "right" as const, turkishName: "Sağ" },
  { word: "YUKARI", position: "top" as const, turkishName: "Yukarı" },
  { word: "AŞAĞI", position: "bottom" as const, turkishName: "Aşağı" },
];

export const POSITION_CLASS: Record<string, string> = {
  top: "top-1 left-1/2 -translate-x-1/2",
  bottom: "bottom-1 left-1/2 -translate-x-1/2",
  left: "left-1 top-1/2 -translate-y-1/2",
  right: "right-1 top-1/2 -translate-y-1/2",
};

export const getGridSize = (level: number): number => (level <= 8 ? 5 : 7);

export const generateTarget = (
  pPos: GridPos,
  size: number,
  random: () => number = Math.random,
): GridPos => {
  let pos: GridPos;
  do {
    pos = {
      row: Math.floor(random() * size),
      col: Math.floor(random() * size),
    };
  } while (
    (pos.row === pPos.row && pos.col === pPos.col) ||
    Math.abs(pos.row - pPos.row) + Math.abs(pos.col - pPos.col) < 2
  );
  return pos;
};

export const generateRound = (random: () => number = Math.random): DirectionStroopRound => {
  const wordIdx = Math.floor(random() * DIRECTIONS.length);
  let posIdx: number;
  do {
    posIdx = Math.floor(random() * DIRECTIONS.length);
  } while (posIdx === wordIdx);
  return {
    word: DIRECTIONS[wordIdx].word,
    position: DIRECTIONS[posIdx].position,
    correctAnswer: DIRECTIONS[posIdx].turkishName,
  };
};

export const checkAnswer = (answer: string, round: DirectionStroopRound): boolean =>
  answer === round.correctAnswer;

export const moveTowardTarget = (current: GridPos, target: GridPos): GridPos => {
  const dr = target.row - current.row;
  const dc = target.col - current.col;
  if (dr === 0 && dc === 0) return current;
  return Math.abs(dr) >= Math.abs(dc)
    ? { ...current, row: current.row + Math.sign(dr) }
    : { ...current, col: current.col + Math.sign(dc) };
};

export const hasReachedTarget = (pos: GridPos, target: GridPos): boolean =>
  pos.row === target.row && pos.col === target.col;

export const getStepsRemaining = (pos: GridPos, target: GridPos): number =>
  Math.abs(pos.row - target.row) + Math.abs(pos.col - target.col);

export const buildDirectionFeedbackMessage = (
  correct: boolean,
  reachedTarget: boolean,
  correctAnswer: string,
  level: number,
  maxLevel: number,
): string => {
  if (correct) {
    if (reachedTarget) {
      if (level >= maxLevel) {
        return `Harika! ${correctAnswer} yönüyle hedefe ulaştın, oyun tamamlanıyor.`;
      }
      return `Doğru yön! Hedefe ulaştın, ${level + 1}. seviyeye geçiyorsun.`;
    }
    return `Doğru yön: ${correctAnswer}. Hedefe bir adım daha yaklaştın.`;
  }
  return `Yanlış seçim! Kelimenin anlamına değil ${correctAnswer.toLowerCase()} konumuna bakmalıydın.`;
};
