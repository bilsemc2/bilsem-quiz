import type { DeyimlerQuestion, DeyimRow } from "./types.ts";

type RandomFn = () => number;

const shuffleItems = <T>(items: readonly T[], random: RandomFn) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const extractEligibleWords = (text: string) =>
  text.split(" ").filter((word) => word.length > 2);

export const createQuestion = (
  deyimler: readonly DeyimRow[],
  random: RandomFn = Math.random,
): DeyimlerQuestion | null => {
  if (deyimler.length < 4) {
    return null;
  }

  const eligibleDeyimler = deyimler.filter(
    (deyim) => extractEligibleWords(deyim.deyim).length > 0,
  );

  if (eligibleDeyimler.length === 0) {
    return null;
  }

  const selectedDeyim =
    eligibleDeyimler[Math.floor(random() * eligibleDeyimler.length)] ?? null;

  if (!selectedDeyim) {
    return null;
  }

  const words = extractEligibleWords(selectedDeyim.deyim);
  const missingWord = words[Math.floor(random() * words.length)] ?? null;

  if (!missingWord) {
    return null;
  }

  const displayText = selectedDeyim.deyim
    .split(" ")
    .map((word) => (word === missingWord ? "______" : word))
    .join(" ");

  const otherWords = deyimler
    .filter((deyim) => deyim.id !== selectedDeyim.id)
    .flatMap((deyim) => extractEligibleWords(deyim.deyim))
    .filter((word) => word !== missingWord);
  const wrongOptions = shuffleItems([...new Set(otherWords)], random).slice(0, 3);

  return {
    deyim: selectedDeyim,
    missingWord,
    displayText,
    options: shuffleItems([...wrongOptions, missingWord], random),
  };
};

export const calculateDeyimlerScore = (level: number) => 10 * level;
