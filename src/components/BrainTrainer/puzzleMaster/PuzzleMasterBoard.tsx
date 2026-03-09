import React from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import PuzzleMasterCanvas from "./PuzzleMasterCanvas";
import PuzzleMasterTargetPanel from "./PuzzleMasterTargetPanel";
import type { PuzzleLevelData, SelectionPosition } from "./types";

interface PuzzleMasterBoardProps {
  feedbackState: FeedbackState | null;
  isLoading: boolean;
  levelData: PuzzleLevelData | null;
  selection: SelectionPosition;
  onCheck: () => void;
  onSelectionChange: (selection: SelectionPosition) => void;
}

const PuzzleMasterBoard: React.FC<PuzzleMasterBoardProps> = ({
  feedbackState,
  isLoading,
  levelData,
  onCheck,
  onSelectionChange,
  selection,
}) => {
  return (
    <motion.div
      key="game"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 items-start p-2"
    >
      <div className="lg:col-span-1 flex flex-col gap-3 lg:sticky top-4">
        <PuzzleMasterTargetPanel
          isLoading={isLoading}
          targetThumbnail={levelData?.targetThumbnail ?? null}
        />
      </div>

      <div className="lg:col-span-3 flex flex-col items-center gap-3 w-full">
        <PuzzleMasterCanvas
          feedbackState={feedbackState}
          isLoading={isLoading}
          levelData={levelData}
          selection={selection}
          onSelectionChange={onSelectionChange}
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCheck}
          disabled={isLoading || Boolean(feedbackState) || !levelData}
          className="w-full sm:w-auto px-12 py-4 bg-cyber-green text-black font-nunito font-black text-xl uppercase tracking-widest border-2 border-black/10 rounded-xl shadow-neo-sm active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Target size={24} className="stroke-[3]" />
          <span>Burada!</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PuzzleMasterBoard;
