import React from "react";
import { motion } from "framer-motion";
import { Smile, Eye } from "lucide-react";
import GameOptionButton from "./shared/GameOptionButton";
import type { FeedbackResult } from "./shared/GameOptionButton";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { MAX_LEVEL } from "./faceExpression/logic";
import { useFaceExpressionController } from "./faceExpression/useFaceExpressionController";

const FaceExpressionGame: React.FC = () => {
  const { engine, feedback, currentQuestion, selectedAnswer, handleAnswer } =
    useFaceExpressionController();
  const { phase, level } = engine;
  const { feedbackState } = feedback;

  const gameConfig = {
    title: "Yüz İfadesi Tanıma",
    description: "Duyguları gözlerinden tanı! Emojilerin hangi duyguyu temsil ettiğini bul ve empati yeteneğini geliştir.",
    tuzoCode: "TUZÖ 7.1.1 Sosyal Algı",
    icon: Eye,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Ekrana gelen yüz ifadesini dikkatle incele.",
      "Alttaki seçeneklerden doğru duyguyu seç.",
      "Hızlı ve doğru cevaplarla en yüksek skora ulaş!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full">
          {phase === "playing" && currentQuestion && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center space-y-6"
            >
              <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm relative overflow-hidden">
                <p className="text-slate-500 dark:text-slate-400 font-nunito font-black mb-3 text-xs sm:text-sm tracking-widest uppercase">
                  BU HANGİ DUYGU?
                </p>
                <motion.div
                  key={level}
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="text-7xl sm:text-8xl mb-1"
                >
                  {currentQuestion.emoji}
                </motion.div>
                <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                  <Smile size={140} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full px-2 relative z-20">
                {currentQuestion.options.map((emotion) => {
                  const isSelected = selectedAnswer === emotion.id;
                  const isCorrect = emotion.id === currentQuestion.correctEmotion.id;
                  const showResult = selectedAnswer !== null;

                  let result: FeedbackResult = null;
                  if (showResult) {
                    if (isCorrect) result = "correct";
                    else if (isSelected) result = "wrong";
                    else result = "dimmed";
                  }

                  return (
                    <GameOptionButton
                      key={emotion.id}
                      variant="text"
                      label={emotion.name}
                      onClick={() => handleAnswer(emotion.id)}
                      disabled={selectedAnswer !== null || !!feedbackState}
                      feedbackResult={result}
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

export default FaceExpressionGame;
