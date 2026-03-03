import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Smile } from "lucide-react";
import GameOptionButton from "./shared/GameOptionButton";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const GAME_ID = "emoji-stroop";
const GAME_TITLE = "Emoji Stroop";
const GAME_DESCRIPTION = "Gördüğün emojiye odaklan, yazıyla kafanı karıştırmalarına izin verme ve duyguları hızla tanımla!";
const TUZO_TEXT = "TUZÖ 5.1.3 Duygusal Farkındalık & Stroop Etkisi";

const EMOTIONS = [
  { emoji: "😊", name: "Mutlu", word: "MUTLU" },
  { emoji: "😢", name: "Üzgün", word: "ÜZGÜN" },
  { emoji: "😠", name: "Kızgın", word: "KIZGIN" },
  { emoji: "😨", name: "Korkmuş", word: "KORKMUŞ" },
  { emoji: "😮", name: "Şaşkın", word: "ŞAŞKIN" },
  { emoji: "😴", name: "Uykulu", word: "UYKULU" },
  { emoji: "🤔", name: "Düşünceli", word: "DÜŞÜNCELİ" },
  { emoji: "😍", name: "Aşık", word: "AŞIK" },
];

interface Round {
  emoji: string;
  word: string;
  correctAnswer: string;
  options: string[];
}

const EmojiStroopGame: React.FC = () => {
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: 20,
    initialLives: 5,
    timeLimit: 180,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;

  const { phase, level, addScore, loseLife, nextLevel } = engine;
  const [currentRound, setCurrentRound] = useState<Round | null>(null);

  const generateRound = useCallback((): Round => {
    const emoIdx = Math.floor(Math.random() * EMOTIONS.length);
    const emoji = EMOTIONS[emoIdx].emoji;
    const correctAnswer = EMOTIONS[emoIdx].name;

    let wordIdx;
    do {
      wordIdx = Math.floor(Math.random() * EMOTIONS.length);
    } while (wordIdx === emoIdx);

    const word = EMOTIONS[wordIdx].word;
    const opts = new Set<string>([correctAnswer]);

    while (opts.size < 4) {
      opts.add(EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)].name);
    }

    return {
      emoji,
      word,
      correctAnswer,
      options: Array.from(opts).sort(() => Math.random() - 0.5),
    };
  }, []);

  const startLevel = useCallback(() => {
    setCurrentRound(generateRound());
    playSound("slide");
  }, [generateRound, playSound]);

  useEffect(() => {
    if (phase === "playing" && !currentRound) {
      startLevel();
    } else if (phase === "welcome") {
      setCurrentRound(null);
    }
  }, [phase, currentRound, startLevel]);

  const handleAnswer = (answer: string) => {
    if (phase !== "playing" || !!feedbackState) return;

    const correct = answer === currentRound?.correctAnswer;

    if (correct) {
      playSound("correct");
      showFeedback(true);
      addScore(20 + level * 5);

      safeTimeout(() => {
        dismissFeedback();
        nextLevel();
        if (level < 20) {
          startLevel();
        }
      }, 1000);
    } else {
      playSound("incorrect");
      showFeedback(false);
      loseLife();
      safeTimeout(dismissFeedback, 1000);
    }
  };

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Smile,
    accentColor: "cyber-yellow",
    maxLevel: 20,
    howToPlay: [
      "Ekrandaki emojiye bak, altındaki yazıya ALDANMA.",
      "Emojinin temsil ettiği gerçek duyguyu aşağıdaki seçeneklerden bul.",
      "Zihinsel çelişkiyi yen ve en hızlı şekilde doğruyu seç."
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-3xl mx-auto">
          {phase === "playing" && currentRound && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl space-y-4 sm:space-y-6 flex flex-col items-center"
            >
              <div className="flex flex-col items-center gap-4 relative">
                <motion.div
                  key={currentRound.emoji}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-36 h-36 sm:w-44 sm:h-44 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 flex items-center justify-center shadow-neo-sm text-7xl sm:text-8xl cursor-default select-none"
                >
                  {currentRound.emoji}
                </motion.div>

                <motion.div
                  key={currentRound.word}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-cyber-pink px-6 py-2.5 rounded-xl border-2 border-black/10 shadow-neo-sm"
                >
                  <span className="text-2xl sm:text-3xl font-black font-nunito text-black tracking-widest uppercase">
                    {currentRound.word}
                  </span>
                </motion.div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                {currentRound.options.map((opt) => (
                  <GameOptionButton
                    key={opt}
                    variant="text"
                    label={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={!!feedbackState}
                    className="uppercase"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default EmojiStroopGame;
