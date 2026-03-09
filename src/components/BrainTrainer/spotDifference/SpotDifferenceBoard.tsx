import React from "react";
import { motion } from "framer-motion";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import {
  ACTIVE_TIME_BAR_COLOR,
  DIFF_LABELS,
  WARNING_TIME_BAR_COLOR,
} from "./constants";
import SpotDifferenceTile from "./SpotDifferenceTile";
import type { RoundData, TileData } from "./types";

interface SpotDifferenceBoardProps {
  roundData: RoundData;
  tiles: TileData[];
  roundTimeLeft: number;
  selectedIndex: number | null;
  feedbackState: FeedbackState | null;
  onPick: (index: number) => void;
}

const SpotDifferenceBoard: React.FC<SpotDifferenceBoardProps> = ({
  roundData,
  tiles,
  roundTimeLeft,
  selectedIndex,
  feedbackState,
  onPick,
}) => {
  return (
    <motion.div
      key="game"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg"
    >
      <div className="mb-6 h-4 bg-white dark:bg-slate-800 rounded-full overflow-hidden border-2 border-black/10 p-0.5 shadow-neo-sm -rotate-1">
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${(roundTimeLeft / roundData.perRoundTime) * 100}%`,
            background:
              roundTimeLeft < 3
                ? WARNING_TIME_BAR_COLOR
                : ACTIVE_TIME_BAR_COLOR,
            transition: "background 0.3s",
          }}
        />
      </div>

      <div className="mb-6 text-center">
        <span className="px-5 py-2 bg-cyber-yellow rounded-xl border-2 border-black/10 text-sm font-nunito font-black text-black tracking-wider uppercase shadow-neo-sm rotate-2 inline-block">
          Fark Tipi: {DIFF_LABELS[roundData.diffType]}
        </span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-black/10 shadow-neo-sm rotate-1">
        <div
          className="grid gap-3 sm:gap-4"
          style={{
            gridTemplateColumns: `repeat(${roundData.size}, minmax(0, 1fr))`,
          }}
        >
          {tiles.map((tile) => (
            <SpotDifferenceTile
              key={tile.index}
              tile={tile}
              isOdd={tile.index === roundData.oddIndex}
              isSelected={tile.index === selectedIndex}
              isRevealed={!!feedbackState}
              onClick={() => onPick(tile.index)}
              disabled={!!feedbackState}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SpotDifferenceBoard;
