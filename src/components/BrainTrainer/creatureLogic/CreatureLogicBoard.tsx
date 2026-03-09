import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import CreatureCard from "./CreatureCard";
import type { RoundData } from "./types";

interface CreatureLogicBoardProps {
  round: RoundData;
  selectedIds: number[];
  feedbackState: FeedbackState | null;
  onToggleCreature: (id: number) => void;
  onSubmit: () => void;
}

const getGridClassName = (count: number) => {
  if (count <= 6) {
    return "grid-cols-2 sm:grid-cols-3 mx-auto max-w-xl";
  }

  if (count <= 9) {
    return "grid-cols-3 mx-auto max-w-2xl";
  }

  return "grid-cols-3 sm:grid-cols-4";
};

const CreatureLogicBoard: React.FC<CreatureLogicBoardProps> = ({
  round,
  selectedIds,
  feedbackState,
  onToggleCreature,
  onSubmit,
}) => {
  const showResults = !!feedbackState;

  return (
    <motion.div
      key="game"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl"
    >
      <div className="p-4 sm:p-5 rounded-2xl bg-cyber-pink border-2 border-black/10 shadow-neo-sm mb-4 relative overflow-hidden">
        <div className="relative z-10 flex items-start gap-3 text-black">
          <Zap className="text-black flex-shrink-0 mt-1 fill-black" size={20} />
          <p className="text-lg sm:text-xl font-nunito font-black uppercase tracking-tight leading-tight">
            {round.instruction}
          </p>
        </div>
      </div>

      <div className={`grid gap-3 sm:gap-4 mb-4 ${getGridClassName(round.creatures.length)}`}>
        {round.creatures.map((creature) => (
          <CreatureCard
            key={creature.id}
            creature={creature}
            isSelected={selectedIds.includes(creature.id)}
            isTarget={round.targetIds.includes(creature.id)}
            showResults={showResults}
            onClick={() => onToggleCreature(creature.id)}
            disabled={showResults}
          />
        ))}
      </div>

      <div className="flex justify-center">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSubmit}
          disabled={selectedIds.length === 0 || showResults}
          className="px-8 py-3 bg-cyber-blue text-white font-nunito font-black text-lg sm:text-xl uppercase tracking-widest border-2 border-black/10 shadow-neo-sm rounded-xl transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 flex items-center gap-2"
        >
          <span>Onayla</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CreatureLogicBoard;
