export const GAME_ID = "son-harf-ustasi";
export const MAX_LEVEL = 20;
export const FEEDBACK_DURATION_MS = 1200;

export interface LastLetterItem {
  text: string;
  emoji: string;
}

export interface Puzzle {
  items: LastLetterItem[];
  correctAnswer: string;
  options: string[];
}

export const ITEM_POOL: LastLetterItem[] = [
  { text: "Kitap", emoji: "📕" }, { text: "Masa", emoji: "🪑" }, { text: "Kalem", emoji: "✏️" },
  { text: "Silgi", emoji: "🧼" }, { text: "Defter", emoji: "📓" }, { text: "Çanta", emoji: "🎒" },
  { text: "Makas", emoji: "✂️" }, { text: "Cetvel", emoji: "📏" }, { text: "Ataş", emoji: "📎" },
  { text: "Harita", emoji: "🗺️" }, { text: "Büyüteç", emoji: "🔎" }, { text: "Saat", emoji: "⏰" },
  { text: "Elma", emoji: "🍎" }, { text: "Armut", emoji: "🍐" }, { text: "Muz", emoji: "🍌" },
  { text: "Çilek", emoji: "🍓" }, { text: "Limon", emoji: "🍋" }, { text: "Karpuz", emoji: "🍉" },
  { text: "Üzüm", emoji: "🍇" }, { text: "Kiraz", emoji: "🍒" }, { text: "Ananas", emoji: "🍍" },
  { text: "Havuç", emoji: "🥕" }, { text: "Mısır", emoji: "🌽" }, { text: "Patlıcan", emoji: "🍆" },
  { text: "Kedi", emoji: "🐱" }, { text: "Köpek", emoji: "🐶" }, { text: "Balık", emoji: "🐟" },
  { text: "Kuş", emoji: "🐦" }, { text: "Fil", emoji: "🐘" }, { text: "Aslan", emoji: "🦁" },
  { text: "Kaplan", emoji: "🐅" }, { text: "Maymun", emoji: "🐒" }, { text: "At", emoji: "🐎" },
  { text: "İnek", emoji: "🐄" }, { text: "Koyun", emoji: "🐑" }, { text: "Tavuk", emoji: "🐔" },
  { text: "Arı", emoji: "🐝" }, { text: "Kelebek", emoji: "🦋" }, { text: "Uğur Böceği", emoji: "🐞" },
  { text: "Araba", emoji: "🚗" }, { text: "Uçak", emoji: "✈️" }, { text: "Gemi", emoji: "🚢" },
  { text: "Tren", emoji: "🚂" }, { text: "Otobüs", emoji: "🚌" }, { text: "Bisiklet", emoji: "🚲" },
  { text: "Motosiklet", emoji: "🏍️" }, { text: "Roket", emoji: "🚀" }, { text: "Helikopter", emoji: "🚁" },
  { text: "Güneş", emoji: "☀️" }, { text: "Ay", emoji: "🌙" }, { text: "Yıldız", emoji: "⭐" },
  { text: "Bulut", emoji: "☁️" }, { text: "Yağmur", emoji: "🌧️" }, { text: "Kar", emoji: "❄️" },
  { text: "Ağaç", emoji: "🌳" }, { text: "Çiçek", emoji: "🌸" }, { text: "Gül", emoji: "🌹" },
  { text: "Ateş", emoji: "🔥" }, { text: "Su", emoji: "💧" }, { text: "Gökkuşağı", emoji: "🌈" },
  { text: "Yatak", emoji: "🛏️" }, { text: "Koltuk", emoji: "🛋️" }, { text: "Lamba", emoji: "💡" },
  { text: "Kapı", emoji: "🚪" }, { text: "Anahtar", emoji: "🔑" }, { text: "Hediye", emoji: "🎁" },
  { text: "Balon", emoji: "🎈" }, { text: "Top", emoji: "⚽" }, { text: "Kupa", emoji: "🏆" },
  { text: "Telefon", emoji: "📱" }, { text: "Bilgisayar", emoji: "💻" }, { text: "Kamera", emoji: "📷" },
  { text: "Şemsiye", emoji: "☂️" }, { text: "Gözlük", emoji: "👓" }, { text: "Şapka", emoji: "🧢" },
];

const ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";

export const shuffle = <T,>(arr: T[], random: () => number = Math.random): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const calcAnswer = (words: string[]): string =>
  words.map((w) => w.trim().slice(-1).toLocaleUpperCase("tr-TR")).join("");

export const generateDistractors = (
  cor: string,
  random: () => number = Math.random,
): string[] => {
  const list = new Set<string>();
  list.add(cor);
  while (list.size < 4) {
    let fake = "";
    if (random() > 0.4) {
      const idx = Math.floor(random() * cor.length);
      let ch = ALPHABET[Math.floor(random() * ALPHABET.length)];
      while (ch === cor[idx]) ch = ALPHABET[Math.floor(random() * ALPHABET.length)];
      fake = cor.substring(0, idx) + ch + cor.substring(idx + 1);
    } else {
      for (let i = 0; i < cor.length; i++) fake += ALPHABET[Math.floor(random() * ALPHABET.length)];
    }
    if (fake !== cor) list.add(fake);
  }
  return shuffle(Array.from(list), random);
};

export const getItemCountForLevel = (level: number): number =>
  level <= 5 ? 3 : level <= 12 ? 4 : 5;

export const generatePuzzle = (
  level: number,
  random: () => number = Math.random,
): Puzzle => {
  const count = getItemCountForLevel(level);
  const items = shuffle(ITEM_POOL, random).slice(0, count);
  const ans = calcAnswer(items.map((i) => i.text));
  return { items, correctAnswer: ans, options: generateDistractors(ans, random) };
};

export const checkAnswer = (answer: string, puzzle: Puzzle): boolean =>
  answer === puzzle.correctAnswer;

export const computeScore = (level: number): number => 10 * level;

export const buildLastLetterFeedbackMessage = ({
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
    if (level >= maxLevel) return "Harika! Son bulmacayı da çözdün!";
    return `Doğru! ${level + 1}. seviyeye geçiyorsun.`;
  }
  return `Yanlış! Doğru sonuç: ${correctAnswer}`;
};
