import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Grid3X3 } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import MatrixPuzzleBoard from "./matrixPuzzle/MatrixPuzzleBoard";
import MatrixPuzzleReview from "./matrixPuzzle/MatrixPuzzleReview";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./matrixPuzzle/constants";
import { useMatrixPuzzleController } from "./matrixPuzzle/useMatrixPuzzleController";

const MatrixPuzzleGame: React.FC = () => {
  const {
    engine,
    feedback,
    currentQuestion,
    selectedOption,
    questionHistory,
    isReviewing,
    setIsReviewing,
    handleOptionSelect,
  } = useMatrixPuzzleController();

  if (isReviewing) {
    return (
      <MatrixPuzzleReview
        entries={questionHistory.filter((entry) => !entry.isCorrect)}
        onBack={() => setIsReviewing(false)}
      />
    );
  }

  const extraGameOverActions = questionHistory.some((entry) => !entry.isCorrect) ? (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsReviewing(true)}
      className="w-full sm:w-auto px-6 py-4 bg-cyber-blue text-white font-nunito font-black text-lg uppercase tracking-widest border-2 border-black/10 shadow-neo-sm rounded-2xl hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3"
    >
      <CheckCircle2 size={24} className="stroke-[3]" />
      <span>Hata Analizi</span>
    </motion.button>
  ) : null;

  return (
    <BrainTrainerShell
      config={{
        title: GAME_TITLE,
        description: GAME_DESCRIPTION,
        tuzoCode: TUZO_TEXT,
        icon: Grid3X3,
        accentColor: "cyber-blue",
        maxLevel: MAX_LEVEL,
        wideLayout: true,
        extraGameOverActions,
        howToPlay: [
          "Satir ve sutunlardaki degisim kuralini belirle.",
          "Soru isareti yerine gelecek sekli sec.",
          "Yanlis secimler can goturur.",
        ],
      }}
      engine={engine}
      feedback={feedback}
    >
      {() =>
        currentQuestion ? (
          <MatrixPuzzleBoard
            grid={currentQuestion.grid}
            options={currentQuestion.options}
            selectedOption={selectedOption}
            onOptionSelect={handleOptionSelect}
          />
        ) : null
      }
    </BrainTrainerShell>
  );
};

export default MatrixPuzzleGame;
