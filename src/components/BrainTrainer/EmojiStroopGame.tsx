import React from "react";
import { motion } from "framer-motion";
import { Smile } from "lucide-react";
import GameOptionButton from "./shared/GameOptionButton";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import {
  MAX_LEVEL,
  useEmojiStroopController,
} from "./emojiStroop/useEmojiStroopController";

const EmojiStroopGame: React.FC = () => {
  const { engine, feedback, currentRound, handleAnswer } =
    useEmojiStroopController();
  const { phase } = engine;
  const { feedbackState } = feedback;

  const gameConfig = {
    title: "Emoji Stroop",
    description: "Gördüğün emojiye odaklan, yazıyla kafanı karıştırmalarına izin verme ve duyguları hızla tanımla!",
    tuzoCode: "TUZÖ 5.1.3 Duygusal Farkındalık & Stroop Etkisi",
    icon: Smile,
    accentColor: "cyber-yellow",
    maxLevel: MAX_LEVEL,
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
