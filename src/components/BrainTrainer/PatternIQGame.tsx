import React from "react";
import { motion } from "framer-motion";
import { RefreshCw, Shapes } from "lucide-react";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { PatternIQBoard } from "./patternIQ/PatternIQBoard";
import {
  MAX_LEVEL,
  WAGON_COUNT,
  usePatternIQController,
} from "./patternIQ/usePatternIQController";

const PatternIQGame: React.FC = () => {
  const {
    engine,
    feedback,
    currentPattern,
    options,
    revealed,
    selectedIndex,
    handleAnswer,
    skipQuestion,
  } = usePatternIQController();
  const { feedbackState } = feedback;

  const extraHudItems = (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={skipQuestion}
      disabled={engine.phase !== "playing" || !!feedbackState}
      className={`flex items-center gap-2 rounded-xl border-2 border-black/10 bg-white px-3 py-2 font-nunito text-sm font-bold text-black shadow-neo-sm transition-all dark:bg-slate-800 dark:text-white sm:px-4 ${
        engine.phase !== "playing" || !!feedbackState
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-slate-50"
      }`}
    >
      <RefreshCw size={16} className="stroke-[3] text-black dark:text-white" />
      <span>Atla</span>
    </motion.button>
  );

  const gameConfig = {
    title: "PatternIQ Express",
    description:
      "Görsel örüntülerin gizemini çöz ve bir sonraki şekli tahmin et. Mantık ve dikkat yeteneğini zirveye taşı!",
    tuzoCode: "TUZÖ 5.5.1 Örüntü Analizi",
    icon: Shapes,
    accentColor: "cyber-pink",
    wideLayout: true,
    maxLevel: MAX_LEVEL,
    howToPlay: [
      <>Şekillerin nasıl değiştiğine <strong>dikkat et</strong></>,
      <>Oluşan <strong>örüntü kuralını bul</strong></>,
      <>Sıradaki vagonu <strong>en hızlı şekilde seç</strong></>,
    ],
    extraHudItems:
      engine.phase === "playing" || engine.phase === "feedback"
        ? extraHudItems
        : undefined,
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() =>
        currentPattern ? (
          <PatternIQBoard
            pattern={currentPattern}
            options={options}
            revealed={revealed}
            selectedIndex={selectedIndex}
            feedbackState={feedbackState}
            wagonCount={WAGON_COUNT}
            onAnswer={handleAnswer}
          />
        ) : null
      }
    </BrainTrainerShell>
  );
};

export default PatternIQGame;
