import { COLOR_OPTIONS, MAX_LEVEL } from "./constants.ts";
import type {
  PencilColor,
  PencilStroopOptionStyle,
  PencilStroopRound,
} from "./types.ts";

const pickRandomIndex = (length: number, random: () => number) => {
  return Math.floor(random() * length);
};

const pickDistinctColor = (
  excludedNames: string[],
  random: () => number,
): PencilColor => {
  const excluded = new Set(excludedNames);
  let candidate = COLOR_OPTIONS[0];

  do {
    candidate = COLOR_OPTIONS[pickRandomIndex(COLOR_OPTIONS.length, random)];
  } while (excluded.has(candidate.name));

  return candidate;
};

const shuffleItems = <T,>(items: T[], random: () => number): T[] => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = pickRandomIndex(index + 1, random);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const createOptionStyle = (
  option: PencilColor,
  random: () => number,
): PencilStroopOptionStyle => {
  const textColor = pickDistinctColor([option.name], random);
  const bgColor = pickDistinctColor([textColor.name], random);

  return {
    textColor,
    bgColor,
  };
};

export const createRound = (
  random: () => number = Math.random,
): PencilStroopRound => {
  const pencilColorObj =
    COLOR_OPTIONS[pickRandomIndex(COLOR_OPTIONS.length, random)];
  const wordObj = pickDistinctColor([pencilColorObj.name], random);
  const labelTextColor = pickDistinctColor(
    [pencilColorObj.name, wordObj.name],
    random,
  );

  const options = [pencilColorObj];

  while (options.length < 4) {
    const nextOption = pickDistinctColor(
      options.map((option) => option.name),
      random,
    );
    options.push(nextOption);
  }

  const shuffledOptions = shuffleItems(options, random);

  return {
    pencilColorObj,
    wordObj,
    labelTextColor,
    correctAnswer: pencilColorObj.name,
    options: shuffledOptions,
    optionStyles: shuffledOptions.map((option) => createOptionStyle(option, random)),
  };
};

export const calculatePencilStroopScore = (level: number) => {
  return 20 + level * 5;
};

export const isAnswerCorrect = (
  answer: string,
  round: PencilStroopRound | null,
) => {
  return answer === round?.correctAnswer;
};

export const isMaxLevel = (level: number) => {
  return level >= MAX_LEVEL;
};

export const buildPencilStroopFeedbackMessage = (
  correct: boolean,
  correctAnswer: string,
  level: number,
) => {
  if (correct) {
    if (isMaxLevel(level)) {
      return `Doğru renk: ${correctAnswer}. Son turu da geçtin, oyun tamamlanıyor.`;
    }

    return `Doğru renk: ${correctAnswer}. Şimdi ${level + 1}. seviyeye geçiyorsun.`;
  }

  return `Yanlış seçim! Kalemin gerçek rengi ${correctAnswer} olmalıydı.`;
};
