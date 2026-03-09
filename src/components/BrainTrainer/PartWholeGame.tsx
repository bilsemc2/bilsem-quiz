import React from "react";
import { motion } from "framer-motion";
import { Puzzle, RefreshCw } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import PartWholeBoard from "./partWhole/PartWholeBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./partWhole/constants";
import { usePartWholeController } from "./partWhole/usePartWholeController";

const PartWholeGame: React.FC = () => {
  const {
    engine,
    feedback,
    gamePattern,
    options,
    targetPos,
    selectedAnswer,
    handleAnswer,
    skipQuestion,
  } = usePartWholeController();

  const extraHudItems =
    engine.phase === "playing" || engine.phase === "feedback" ? (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={skipQuestion}
        disabled={engine.phase !== "playing" || !!feedback.feedbackState}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border-2 border-black/10 transition-all shadow-neo-sm font-nunito font-bold text-sm text-black dark:text-white ${
          engine.phase !== "playing" || !!feedback.feedbackState
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-slate-50"
        }`}
      >
        <RefreshCw
          size={16}
          className="stroke-[3] text-black dark:text-white"
        />
        <span>Atla</span>
      </motion.button>
    ) : undefined;

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        description: GAME_DESCRIPTION,
        tuzoCode: TUZO_TEXT,
        icon: Puzzle,
        accentColor: "cyber-green",
        maxLevel: MAX_LEVEL,
        backLink: "/atolyeler/tablet-degerlendirme",
        backLabel: "Tablet Degerlendirme",
        wideLayout: true,
        extraHudItems,
        howToPlay: [
          "Desendeki beyaz bosluga odaklan.",
          "Asagidaki parcalardan uygun olani sec.",
          "Seviye ilerledikce desenler karmasiklasir.",
        ],
      }}
    >
      {({ feedbackState, phase }) => (
        <div className="w-full max-w-5xl">
          {phase === "playing" && gamePattern.length > 0 ? (
            <PartWholeBoard
              feedbackState={feedbackState}
              gamePattern={gamePattern}
              options={options}
              selectedAnswer={selectedAnswer}
              targetPos={targetPos}
              onAnswer={handleAnswer}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default PartWholeGame;
