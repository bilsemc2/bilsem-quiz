import { ANSWER_LABELS, MAX_LEVEL } from "./constants.ts";
import type {
  VerbalAnalogyOption,
  VerbalAnalogyQuestion,
  VerbalAnalogyRow,
} from "./types.ts";

const shuffleArray = <T>(items: T[], randomFn: () => number = Math.random) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const toSourceOptions = (row: VerbalAnalogyRow) => {
  return [
    { sourceId: "a", text: row.secenek_a },
    { sourceId: "b", text: row.secenek_b },
    { sourceId: "c", text: row.secenek_c },
    { sourceId: "d", text: row.secenek_d },
  ].filter(
    (option): option is { sourceId: string; text: string } =>
      typeof option.text === "string" && option.text.trim().length > 0,
  );
};

export const mapRowToQuestion = (
  row: VerbalAnalogyRow,
  randomFn: () => number = Math.random,
): VerbalAnalogyQuestion | null => {
  if (!row.soru_metni?.trim() || !row.dogru_cevap) {
    return null;
  }

  const shuffledOptions = shuffleArray(toSourceOptions(row), randomFn);
  const correctIndex = shuffledOptions.findIndex(
    (option) => option.sourceId === row.dogru_cevap,
  );

  if (correctIndex === -1) {
    return null;
  }

  const options: VerbalAnalogyOption[] = shuffledOptions.map((option, index) => ({
    id: ANSWER_LABELS[index] ?? String(index + 1),
    text: option.text,
  }));

  return {
    id: row.id,
    text: row.soru_metni,
    options,
    correctOptionId: ANSWER_LABELS[correctIndex],
    explanation: row.aciklama ?? undefined,
  };
};

export const buildQuestions = (
  rows: VerbalAnalogyRow[],
  maxQuestions = MAX_LEVEL,
  randomFn: () => number = Math.random,
) => {
  return shuffleArray(rows, randomFn)
    .map((row) => mapRowToQuestion(row, randomFn))
    .filter((question): question is VerbalAnalogyQuestion => question !== null)
    .slice(0, maxQuestions);
};

export const calculateVerbalAnalogyScore = (level: number) => {
  return 100 + level * 10;
};

export const getErrorActionLabel = (isExamMode: boolean) => {
  return isExamMode ? "Devam Et" : "Geri Dön";
};
