export const GAME_ID = "cumle-ici-es-anlam";
export const TIME_LIMIT = 180;
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1200;

export interface SentenceSynonymOption {
  id: string;
  text: string;
}

export interface SentenceSynonymQuestion {
  id: number;
  cumle: string;
  options: SentenceSynonymOption[];
  correct_option_id: string;
  dogru_kelime: string;
}

const shuffleItems = <T,>(items: readonly T[], random: () => number): T[] => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export const parseQuestions = (
  data: Array<{
    id: number;
    cumle: string;
    secenek_a: string;
    secenek_b: string;
    secenek_c: string;
    secenek_d: string;
    dogru_cevap: string;
    dogru_kelime: string;
  }>,
  maxLevel: number,
  random: () => number = Math.random,
): SentenceSynonymQuestion[] => {
  const labels = ["a", "b", "c", "d"];
  const shuffled = shuffleItems(data, random).slice(0, maxLevel);

  return shuffled.map((q) => {
    const raw = [
      { id: "a", t: q.secenek_a },
      { id: "b", t: q.secenek_b },
      { id: "c", t: q.secenek_c },
      { id: "d", t: q.secenek_d },
    ];
    const shuf = shuffleItems(raw, random);
    const corrIdx = shuf.findIndex((o) => o.id === q.dogru_cevap);

    return {
      id: q.id,
      cumle: q.cumle,
      options: shuf.map((o, i) => ({ id: labels[i], text: o.t })),
      correct_option_id: labels[corrIdx],
      dogru_kelime: q.dogru_kelime,
    };
  });
};

export const checkAnswer = (
  selectedId: string,
  question: SentenceSynonymQuestion,
): boolean => selectedId === question.correct_option_id;

export const computeScore = (streak: number): number => 100 + streak * 10;

export const formatSentence = (t: string): string => {
  const m = t.match(/^'(.+?)'\s*cümlesindeki/);
  return m ? m[1] : t;
};

export const buildSentenceSynonymFeedbackMessage = ({
  isCorrect,
  level,
  maxLevel,
  dogruKelime,
}: {
  isCorrect: boolean;
  level: number;
  maxLevel: number;
  dogruKelime: string;
}): string => {
  if (isCorrect) {
    if (level >= maxLevel) return "Harika! Son soruyu da bildin, tebrikler!";
    return `Doğru! ${level + 1}. seviyeye geçiyorsun.`;
  }
  return `Yanlış! Doğru eş anlam: ${dogruKelime}`;
};
