import { GAME_COLORS } from "../shared/gameColors.ts";

export const GAME_ID = "stroop";
export const INITIAL_LIVES = 5;
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1200;

export interface StroopRound {
  word: string;
  textColor: string;
  correctAnswer: string;
  options: string[];
}

export const COLORS = [
  { name: "KIRMIZI", hex: "#E53935" },
  { name: "MAVİ", hex: "#00E5FF" },
  { name: "YEŞİL", hex: "#00FF66" },
  { name: "SARI", hex: GAME_COLORS.yellow },
  { name: "TURUNCU", hex: "#FF9900" },
  { name: "MOR", hex: "#9D4EDD" },
  { name: "PEMBE", hex: "#FF69B4" },
  { name: "SİYAH", hex: "#000000" },
];

const shuffleItems = <T,>(items: readonly T[], random: () => number): T[] => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export const generateRound = (random: () => number = Math.random): StroopRound => {
  const wordColorIndex = Math.floor(random() * COLORS.length);
  const textColorIndex = Math.floor(random() * COLORS.length);

  const isMatching = random() > 0.6;
  const txtIdx = isMatching ? wordColorIndex : textColorIndex;

  const word = COLORS[wordColorIndex].name;
  const textColor = COLORS[txtIdx].hex;
  const correctAnswer = COLORS[txtIdx].name;

  const wrongOptions = shuffleItems(
    COLORS.filter((c) => c.name !== correctAnswer),
    random,
  )
    .slice(0, 3)
    .map((c) => c.name);

  const options = shuffleItems([correctAnswer, ...wrongOptions], random);

  return { word, textColor, correctAnswer, options };
};

export const checkAnswer = (answer: string, round: StroopRound): boolean =>
  answer === round.correctAnswer;

export const computeScore = (level: number, streak: number): number =>
  level * 20 + streak * 5;

export const shouldLevelUp = (correctCount: number, level: number, maxLevel: number): boolean =>
  correctCount > 0 && correctCount % 8 === 0 && level < maxLevel;

export const shouldFinishGame = (correctCount: number, level: number, maxLevel: number): boolean =>
  correctCount > 0 && correctCount % 8 === 0 && level >= maxLevel;

export const buildStroopFeedbackMessage = ({
  correct,
  levelUp,
  finish,
  level,
}: {
  correct: boolean;
  levelUp: boolean;
  finish: boolean;
  level: number;
}): string => {
  if (correct) {
    if (finish) {
      return "Doğru renk! Son bölümü tamamladın.";
    }
    if (levelUp) {
      return `Doğru renk! ${level + 1}. seviyeye geçiyorsun.`;
    }
    return "Doğru renk! Kelimeye değil yazı rengine odaklandın.";
  }
  return "Yanlış seçim! Kelimeye değil yazının rengine bak.";
};
