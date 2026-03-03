import re

# Fix NumberMemoryGame.tsx
with open("src/components/BrainTrainer/NumberMemoryGame.tsx", "r") as f:
    text = f.read()

text = text.replace('import { Headphones, Sparkles, Volume2 } from "lucide-react";', 'import { Headphones, Volume2 } from "lucide-react";')

with open("src/components/BrainTrainer/NumberMemoryGame.tsx", "w") as f:
    f.write(text)

# Rewrite LastLetterGame.tsx
last_letter_content = """import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Type, Eye } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "son-harf-ustasi";
const GAME_TITLE = "Son Harf Ustası";
const GAME_DESCRIPTION = "Kelimelerin son harflerini birleştirerek gizli şifreyi bul! Sözel analiz ve hafıza gücünü test et.";
const TUZO_TEXT = "TUZÖ 5.1.3 Sözel Analiz";

const ITEM_POOL = [
  { text: "Kitap", emoji: "📕" }, { text: "Masa", emoji: "🪑" }, { text: "Kalem", emoji: "✏️" },
  { text: "Silgi", emoji: "🧼" }, { text: "Defter", emoji: "📓" }, { text: "Çanta", emoji: "🎒" },
  { text: "Makas", emoji: "✂️" }, { text: "Cetvel", emoji: "📏" }, { text: "Ataş", emoji: "📎" },
  { text: "Harita", emoji: "🗺️" }, { text: "Büyüteç", emoji: "🔎" }, { text: "Saat", emoji: "⏰" },
  { text: "Elma", emoji: "🍎" }, { text: "Armut", emoji: "🍐" }, { text: "Muz", emoji: "🍌" },
  { text: "Çilek", emoji: "🍓" }, { text: "Limon", emoji: "🍋" }, { text: "Karpuz", emoji: "🍉" },
  { text: "Üzüm", emoji: "🍇" }, { text: "Kiraz", emoji: "🍒" }, { text: "Ananas", emoji: "��" },
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
  { text: "Yatak", emoji: "🛏️" }, { text: "Koltuk", emoji: "��️" }, { text: "Lamba", emoji: "💡" },
  { text: "Kapı", emoji: "🚪" }, { text: "Anahtar", emoji: "��" }, { text: "Hediye", emoji: "🎁" },
  { text: "Balon", emoji: "🎈" }, { text: "Top", emoji: "⚽" }, { text: "Kupa", emoji: "🏆" },
  { text: "Telefon", emoji: "📱" }, { text: "Bilgisayar", emoji: "��" }, { text: "Kamera", emoji: "📷" },
  { text: "Şemsiye", emoji: "☂️" }, { text: "Gözlük", emoji: "👓" }, { text: "Şapka", emoji: "🧢" },
];

const ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const calcAnswer = (words: string[]): string =>
  words.map((w) => w.trim().slice(-1).toLocaleUpperCase("tr-TR")).join("");

const generateDistractors = (cor: string): string[] => {
  const list = new Set<string>();
  list.add(cor);
  while (list.size < 4) {
    let fake = "";
    if (Math.random() > 0.4) {
      const idx = Math.floor(Math.random() * cor.length);
      let ch = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      while (ch === cor[idx]) ch = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      fake = cor.substring(0, idx) + ch + cor.substring(idx + 1);
    } else {
      for (let i = 0; i < cor.length; i++) fake += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    if (fake !== cor) list.add(fake);
  }
  return shuffle(Array.from(list));
};

interface Puzzle {
  items: { text: string; emoji: string }[];
  correctAnswer: string;
  options: string[];
}

const generatePuzzle = (lvl: number): Puzzle => {
  const count = lvl <= 5 ? 3 : lvl <= 12 ? 4 : 5;
  const items = shuffle(ITEM_POOL).slice(0, count);
  const ans = calcAnswer(items.map((i) => i.text));
  return { items, correctAnswer: ans, options: generateDistractors(ans) };
};

const LastLetterGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [revealWords, setRevealWords] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const startPuzzle = useCallback((lvl: number) => {
    setPuzzle(generatePuzzle(lvl));
    setRevealWords(false);
    playSound("detective_mystery");
  }, [playSound]);

  useEffect(() => {
    if (phase === "playing" && !puzzle) {
      startPuzzle(level);
    } else if (phase === "welcome") {
      setPuzzle(null);
      setRevealWords(false);
    }
  }, [phase, level, puzzle, startPuzzle]);

  const handleGuess = (opt: string) => {
    if (!puzzle || phase !== "playing" || !!feedbackState) return;

    const ok = opt === puzzle.correctAnswer;
    setRevealWords(true);
    showFeedback(ok);
    playSound(ok ? "correct" : "incorrect");

    const t = setTimeout(() => {
      dismissFeedback();
      if (ok) {
        addScore(10 * level);
        nextLevel();
        startPuzzle(level + 1);
      } else {
        loseLife();
        if (engine.lives > 1) {
            startPuzzle(level);
        }
      }
    }, 1500);
    timeoutsRef.current.push(t);
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Type,
    accentColor: "cyber-pink",
    maxLevel: 20,
    howToPlay: [
      "Ekranda görünen eşyaların adlarını zihninden geçir",
      "Her kelimenin son harfini bir kenara not et",
      "Birleşen harflerle oluşan gizli kelimeyi seç!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center flex-1 p-4 mb-10 w-full max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {phase === "playing" && puzzle && (
              <motion.div
                key={`level-${level}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full max-w-4xl text-center"
              >
                <p className="text-slate-500 font-syne font-black mb-8 text-base tracking-widest uppercase bg-white dark:bg-slate-800 border-4 border-black px-4 py-2 rounded-2xl shadow-[4px_4px_0_#000] inline-block -rotate-1">
                  Son Harfleri Birleştir
                </p>

                <div className={`grid gap-4 sm:gap-6 mb-10 ${puzzle.items.length <= 3 ? "grid-cols-3" : puzzle.items.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-5"}`}>
                  {puzzle.items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-6 bg-white dark:bg-slate-800 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000] flex flex-col items-center gap-3 rotate-1 hover:-translate-y-2 hover:shadow-[12px_12px_0_#000] transition-all"
                    >
                      <span className="text-5xl sm:text-6xl drop-shadow-md">{item.emoji}</span>
                      <div className={`transition-all duration-500 overflow-hidden ${revealWords ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
                        <p className="text-lg font-syne font-black tracking-widest mt-2 flex justify-center">
                          {item.text.toLocaleUpperCase("tr-TR").split("").map((char, ci) => (
                            <span key={ci} className={ci === item.text.length - 1 ? "text-cyber-pink text-2xl" : "text-black dark:text-white"}>
                              {char}
                            </span>
                          ))}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {puzzle.options.map((opt, i) => {
                    const isSelected = revealWords; // If guessed, all buttons show selected state indirectly
                    let bgClass = "bg-slate-50 dark:bg-slate-700 hover:bg-cyber-yellow dark:hover:bg-cyber-yellow";
                    if (revealWords) {
                        if (opt === puzzle.correctAnswer) {
                            bgClass = "bg-cyber-green text-black";
                        } else {
                            bgClass = "bg-cyber-pink text-black opacity-50";
                        }
                    }

                    return (
                      <motion.button
                        key={i}
                        whileHover={!revealWords ? { scale: 1.05, y: -4 } : {}}
                        whileTap={!revealWords ? { scale: 0.95 } : {}}
                        onClick={() => handleGuess(opt)}
                        disabled={revealWords}
                        style={i % 2 === 0 ? { transform: "rotate(-1deg)" } : { transform: "rotate(1deg)" }}
                        className={`py-5 sm:py-6 rounded-3xl font-syne font-black text-2xl tracking-[0.2em] transition-all duration-300 border-4 border-black shadow-[8px_8px_0_#000] ${!revealWords ? 'hover:shadow-[12px_12px_0_#000] hover:-translate-y-1 active:translate-y-2 active:shadow-none' : ''} text-black dark:text-white group ${bgClass}`}
                      >
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default LastLetterGame;
"""

with open("src/components/BrainTrainer/LastLetterGame.tsx", "w") as f:
    f.write(last_letter_content)
