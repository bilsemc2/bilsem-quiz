import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import GameOptionButton from "./shared/GameOptionButton";
import type { FeedbackResult } from "./shared/GameOptionButton";
import { Type } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const GAME_ID = "son-harf-ustasi";
const GAME_TITLE = "Son Harf Ustası";
const GAME_DESCRIPTION = "Kelimelerin son harflerini birleştirerek gizli şifreyi bul! Sözel analiz ve hafıza gücünü test et.";
const TUZO_TEXT = "TUZÖ 5.1.3 Sözel Analiz";
const MAX_LEVEL = 20;

const ITEM_POOL = [
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
    maxLevel: MAX_LEVEL,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, lives, addScore, loseLife, nextLevel } = engine;

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [revealWords, setRevealWords] = useState(false);

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

  const handleGuess = useCallback(
    (opt: string) => {
      if (!puzzle || phase !== "playing" || !!feedbackState) return;

      const ok = opt === puzzle.correctAnswer;
      setRevealWords(true);
      showFeedback(ok);
      playSound(ok ? "correct" : "incorrect");

      safeTimeout(() => {
        dismissFeedback();
        if (ok) {
          addScore(10 * level);
          if (level >= MAX_LEVEL) {
            engine.setGamePhase("victory");
            playSound("success");
          } else {
            nextLevel();
            startPuzzle(level + 1);
          }
        } else {
          loseLife();
          if (lives > 1) {
            startPuzzle(level);
          }
        }
      }, 1500);
    },
    [puzzle, phase, feedbackState, level, lives, playSound, showFeedback, dismissFeedback, addScore, loseLife, nextLevel, safeTimeout, startPuzzle, engine],
  );

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Type,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Ekranda görünen eşyaların adlarını zihninden geçir",
      "Her kelimenin son harfini bir kenara not et",
      "Birleşen harflerle oluşan gizli kelimeyi seç!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-2xl mx-auto">
          {phase === "playing" && puzzle && (
            <motion.div
              key={`level-${level}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg text-center"
            >
              <p className="text-slate-500 font-nunito font-black mb-4 text-sm tracking-widest uppercase bg-white dark:bg-slate-800 border-2 border-black/10 px-3 py-1.5 rounded-xl shadow-neo-sm inline-block">
                Son Harfleri Birleştir
              </p>

              <div className={`grid gap-2 sm:gap-3 mb-4 ${puzzle.items.length <= 3 ? "grid-cols-3" : puzzle.items.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-5"}`}>
                {puzzle.items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-xl border-2 border-black/10 shadow-neo-sm flex flex-col items-center gap-1.5"
                  >
                    <span className="text-5xl sm:text-6xl drop-shadow-md">{item.emoji}</span>
                    <div className={`transition-all duration-500 overflow-hidden ${revealWords ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
                      <p className="text-sm font-nunito font-black tracking-widest mt-1 flex justify-center">
                        {item.text.toLocaleUpperCase("tr-TR").split("").map((char, ci) => (
                          <span key={ci} className={ci === item.text.length - 1 ? "text-cyber-pink text-lg" : "text-black dark:text-white"}>
                            {char}
                          </span>
                        ))}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="max-w-sm mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {puzzle.options.map((opt, i) => {
                  let result: FeedbackResult = null;
                  if (revealWords) {
                    if (opt === puzzle.correctAnswer) result = "correct";
                    else result = "wrong";
                  }

                  return (
                    <GameOptionButton
                      key={i}
                      variant="visual"
                      label={opt}
                      onClick={() => handleGuess(opt)}
                      disabled={revealWords}
                      feedbackResult={result}
                      animationDelay={i * 0.08}
                      className="tracking-[0.2em]"
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default LastLetterGame;
