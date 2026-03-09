import type { SynonymQuestion, SynonymRow } from "./types";

const OPTION_IDS = ["a", "b", "c", "d"] as const;

type RandomFn = () => number;

const shuffleItems = <T>(items: readonly T[], random: RandomFn) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

export const buildQuestions = (
  rows: readonly SynonymRow[],
  maxQuestions: number,
  random: RandomFn = Math.random,
) =>
  shuffleItems(rows, random)
    .slice(0, maxQuestions)
    .flatMap((row): SynonymQuestion[] => {
      const shuffledOptions = shuffleItems(
        [
          { id: "a", text: row.secenek_a },
          { id: "b", text: row.secenek_b },
          { id: "c", text: row.secenek_c },
          { id: "d", text: row.secenek_d },
        ],
        random,
      );
      const correctIndex = shuffledOptions.findIndex(
        (option) => option.id === row.dogru_cevap,
      );

      if (correctIndex < 0) {
        return [];
      }

      return [
        {
          id: row.id,
          word: row.kelime,
          options: shuffledOptions.map((option, index) => ({
            id: OPTION_IDS[index],
            text: option.text,
          })),
          correctOptionId: OPTION_IDS[correctIndex],
          synonym: row.es_anlami,
        },
      ];
    });

export const calculateSynonymScore = (streak: number) => 100 + streak * 10;

export const getErrorActionLabel = (examMode: boolean) =>
  examMode ? "Devam Et" : "Geri Dön";
