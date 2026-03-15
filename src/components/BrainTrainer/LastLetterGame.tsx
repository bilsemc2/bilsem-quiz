import React from "react";
import { motion } from "framer-motion";
import GameOptionButton from "./shared/GameOptionButton";
import type { FeedbackResult } from "./shared/GameOptionButton";
import { Type } from "lucide-react";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { MAX_LEVEL } from "./lastLetter/logic";
import { useLastLetterController } from "./lastLetter/useLastLetterController";

const LastLetterGame: React.FC = () => {
  const { engine, feedback, puzzle, revealWords, handleGuess } =
    useLastLetterController();
  const { phase, level } = engine;

  const gameConfig = {
    title: "Son Harf Ustası",
    description: "Kelimelerin son harflerini birleştirerek gizli şifreyi bul! Sözel analiz ve hafıza gücünü test et.",
    tuzoCode: "TUZÖ 5.1.3 Sözel Analiz",
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
