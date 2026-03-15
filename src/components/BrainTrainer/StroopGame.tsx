import React from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import GameOptionButton from "./shared/GameOptionButton";
import type { FeedbackResult } from "./shared/GameOptionButton";
import { MAX_LEVEL } from "./stroop/logic";
import { useStroopController } from "./stroop/useStroopController";

const StroopGame: React.FC = () => {
  const { engine, feedback, currentRound, correctCount, lives, handleAnswer } =
    useStroopController();
  const { phase } = engine;
  const { feedbackState } = feedback;

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Stroop Testi",
        icon: Target,
        description:
          "Yazının RENGİNİ okumaya çalış, KELİMEYİ değil! Beyni şaşırtan bu klasik testte renk-kelime algını hızlandır.",
        howToPlay: [
          "Ekranda yazılı olan kelimeye odaklanma.",
          "Kelimenin HANGİ RENKTE YAZILDIĞINI işaretle.",
          "Süre bitmeden olabildiğince çok eşleşme yap.",
        ],
        tuzoCode: "2.1.2 Seçici Dikkat",
        accentColor: "cyber-yellow",
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          {phase === "playing" && currentRound && (
            <motion.div
              key={`round-${correctCount + (10 - lives) * 100}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-lg flex flex-col gap-6 sm:gap-8"
            >


              {/* Question Area */}
              <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-8 sm:p-12 shadow-neo-sm flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden -rotate-1">
                <div className="absolute inset-0 pattern-grid opacity-10 dark:opacity-5 pointer-events-none" />

                <motion.h2
                  className="relative z-10 w-full max-w-full px-2 text-center leading-tight font-nunito font-black uppercase text-[clamp(1.8rem,10vw,3.5rem)] sm:text-[clamp(2rem,7vw,4.5rem)] tracking-[0.04em] sm:tracking-[0.08em] break-words"
                  style={{
                    color: currentRound.textColor,
                  }}
                  animate={{
                    scale: feedbackState ? (feedbackState.correct ? 1.05 : 0.95) : 1,
                    rotate: feedbackState ? (feedbackState.correct ? 2 : -2) : 0
                  }}
                >
                  {currentRound.word}
                </motion.h2>

                {/* Floating labels for extra distraction */}
                <div className="absolute top-4 left-6 text-2xl font-black font-nunito text-slate-200 dark:text-slate-700 -rotate-12 blur-[1px]">MAVİ</div>
                <div className="absolute bottom-6 right-8 text-3xl font-black font-nunito text-slate-200 dark:text-slate-700 rotate-12 blur-[1px]">SARI</div>
              </div>



              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-4">
                {currentRound.options.map((opt, idx) => {
                  const isCorrect = opt === currentRound.correctAnswer;
                  const rotateClass = idx % 2 === 0 ? "rotate-1" : "-rotate-1";

                  let result: FeedbackResult = null;
                  if (feedbackState) {
                    result = isCorrect ? "correct" : "dimmed";
                  }

                  return (
                    <GameOptionButton
                      key={`${opt}-${idx}`}
                      variant="text"
                      label={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!feedbackState}
                      feedbackResult={result}
                      className={`h-20 sm:h-24 text-base sm:text-xl lg:text-2xl uppercase tracking-[0.08em] sm:tracking-[0.14em] ${!feedbackState ? rotateClass : ""}`}
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

export default StroopGame;
