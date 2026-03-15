import { GAME_COLORS } from "../shared/gameColors.ts";

export const GAME_ID = "yuz-ifadesi";
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1200;

export interface Emotion {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

export interface FaceQuestion {
  emoji: string;
  correctEmotion: Emotion;
  options: Emotion[];
}

export const EMOTIONS: Emotion[] = [
  { id: "mutlu", name: "Mutlu", emoji: "😊", description: "Neşeli, sevinçli", color: GAME_COLORS.yellow },
  { id: "uzgun", name: "Üzgün", emoji: "😢", description: "Kederli, hüzünlü", color: GAME_COLORS.blue },
  { id: "kizgin", name: "Kızgın", emoji: "😠", description: "Öfkeli, sinirli", color: GAME_COLORS.incorrect },
  { id: "saskin", name: "Şaşkın", emoji: "😲", description: "Hayret içinde", color: GAME_COLORS.orange },
  { id: "korkmus", name: "Korkmuş", emoji: "😨", description: "Ürkmüş, endişeli", color: GAME_COLORS.purple },
  { id: "igrenme", name: "İğrenme", emoji: "🤢", description: "Tiksinmiş", color: GAME_COLORS.emerald },
  { id: "notr", name: "Sakin", emoji: "😐", description: "Tarafsız, sakin", color: "#64748b" },
  { id: "bikkin", name: "Bıkkın", emoji: "😒", description: "Sıkılmış, bıkmış", color: GAME_COLORS.orange },
  { id: "dusunceli", name: "Düşünceli", emoji: "🤔", description: "Derin düşüncede", color: GAME_COLORS.blue },
];

export const EXPRESSION_VARIANTS: Record<string, string[]> = {
  mutlu: ["😊", "😄", "😁", "😃"],
  uzgun: ["😢", "😞", "😔", "🙁"],
  kizgin: ["😠", "😡", "😤", "🤬"],
  saskin: ["😲", "😮", "😯", "😳"],
  korkmus: ["😨", "😰", "😱", "😧"],
  igrenme: ["🤢", "🤮", "😷", "😝"],
  notr: ["😐", "😑", "😶"],
  bikkin: ["😒", "🙄", "😮‍💨"],
  dusunceli: ["🤔", "🧐", "🤨", "🫤"],
};

const shuffleItems = <T,>(items: readonly T[], random: () => number): T[] => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export const generateQuestion = (random: () => number = Math.random): FaceQuestion => {
  const correctEmotion = EMOTIONS[Math.floor(random() * EMOTIONS.length)];
  const variants = EXPRESSION_VARIANTS[correctEmotion.id];
  const emoji = variants[Math.floor(random() * variants.length)];
  const wrongOptions = shuffleItems(
    EMOTIONS.filter((e) => e.id !== correctEmotion.id),
    random,
  ).slice(0, 3);
  const options = shuffleItems([correctEmotion, ...wrongOptions], random);
  return { emoji, correctEmotion, options };
};

export const checkAnswer = (emotionId: string, question: FaceQuestion): boolean =>
  emotionId === question.correctEmotion.id;

export const computeScore = (level: number, streak: number): number =>
  10 * level + streak * 5;

export const buildFaceExpressionFeedbackMessage = (
  isCorrect: boolean,
  emotionName: string,
  level: number,
  maxLevel: number,
): string => {
  if (isCorrect) {
    if (level >= maxLevel) {
      return `Harika! ${emotionName} ifadesini doğru tanıdın, oyun tamamlanıyor.`;
    }
    return `Doğru duygu: ${emotionName}. Şimdi ${level + 1}. seviyeye geçiyorsun.`;
  }
  return `Yanlış seçim! Bu ifade ${emotionName} duygusunu gösteriyor.`;
};
