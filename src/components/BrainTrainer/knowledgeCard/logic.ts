import {
  FALLBACK_EXCLUDED_WORDS,
  KEY_WORDS,
  MAX_LEVEL,
} from "./constants.ts";
import type { KnowledgeCardRow, KnowledgeQuestion } from "./types.ts";

const WORD_PUNCTUATION_REGEX = /[.,;:!?()]/g;

const shuffleArray = <T>(items: T[], randomFn: () => number) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const normalizeAnswer = (value: string) => {
  return value.toLowerCase().replace(WORD_PUNCTUATION_REGEX, "").trim();
};

export const createBlankFromSentence = (
  text: string,
  randomFn: () => number = Math.random,
) => {
  const words = text.split(/\s+/);

  for (const keyWord of KEY_WORDS) {
    const wordIndex = words.findIndex(
      (word) => normalizeAnswer(word) === normalizeAnswer(keyWord),
    );

    if (wordIndex !== -1) {
      const originalWord = words[wordIndex].replace(WORD_PUNCTUATION_REGEX, "");
      const punctuation = words[wordIndex].replace(originalWord, "");
      words[wordIndex] = `_____${punctuation}`;
      return { displayText: words.join(" "), answer: originalWord };
    }
  }

  const longWords = words
    .map((word, index) => ({
      word: word.replace(WORD_PUNCTUATION_REGEX, ""),
      index,
      original: word,
    }))
    .filter(
      (entry) =>
        entry.word.length >= 4 &&
        !FALLBACK_EXCLUDED_WORDS.includes(
          entry.word.toLowerCase() as (typeof FALLBACK_EXCLUDED_WORDS)[number],
        ),
    );

  if (longWords.length === 0) {
    return null;
  }

  const selected =
    longWords[Math.floor(randomFn() * longWords.length)];
  const punctuation = selected.original.replace(selected.word, "");
  words[selected.index] = `_____${punctuation}`;
  return { displayText: words.join(" "), answer: selected.word };
};

export const buildQuestionOptions = (
  correctAnswer: string,
  allAnswers: string[],
  randomFn: () => number = Math.random,
) => {
  const uniqueWrongAnswers = Array.from(
    new Set(
      allAnswers.filter(
        (answer) => normalizeAnswer(answer) !== normalizeAnswer(correctAnswer),
      ),
    ),
  );

  const wrongAnswers = shuffleArray(uniqueWrongAnswers, randomFn).slice(0, 3);

  while (wrongAnswers.length < 3) {
    const fallbackWord =
      KEY_WORDS[Math.floor(randomFn() * KEY_WORDS.length)];

    if (
      !wrongAnswers.some(
        (answer) => normalizeAnswer(answer) === normalizeAnswer(fallbackWord),
      ) &&
      normalizeAnswer(fallbackWord) !== normalizeAnswer(correctAnswer)
    ) {
      wrongAnswers.push(fallbackWord);
    }
  }

  return shuffleArray([correctAnswer, ...wrongAnswers], randomFn);
};

export const buildQuestions = (
  rows: KnowledgeCardRow[],
  maxQuestions = MAX_LEVEL,
  randomFn: () => number = Math.random,
): KnowledgeQuestion[] => {
  const answers: string[] = [];
  const questions: Omit<KnowledgeQuestion, "options">[] = [];
  const shuffledRows = shuffleArray(rows, randomFn);

  for (const row of shuffledRows) {
    if (questions.length >= maxQuestions) {
      break;
    }

    const blank = createBlankFromSentence(row.icerik, randomFn);
    if (!blank) {
      continue;
    }

    answers.push(blank.answer);
    questions.push({
      id: row.id,
      originalText: row.icerik,
      displayText: blank.displayText,
      correctAnswer: blank.answer,
    });
  }

  return questions.map((question) => ({
    ...question,
    options: buildQuestionOptions(question.correctAnswer, answers, randomFn),
  }));
};

export const calculateKnowledgeCardScore = (
  level: number,
  streak: number,
) => {
  return 10 * level + streak * 5;
};

export const getBackLink = (isArcadeMode: boolean) => {
  return isArcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
};

export const buildKnowledgeCardFeedbackMessage = ({
  isCorrect,
  level,
  maxLevel,
  correctAnswer,
}: {
  isCorrect: boolean;
  level: number;
  maxLevel: number;
  correctAnswer: string;
}): string => {
  if (isCorrect) {
    if (level >= maxLevel) return "Harika! Son soruyu da bildin, tebrikler!";
    return `Doğru! ${level + 1}. seviyeye geçiyorsun.`;
  }
  return `Yanlış! Doğru cevap: ${correctAnswer}`;
};
