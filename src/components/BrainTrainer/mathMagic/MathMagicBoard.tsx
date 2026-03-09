import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

import GameNumpad from "../shared/GameNumpad";
import { COLORS, MAX_NUMBER_INPUT_LENGTH } from "./constants";
import MathMagicCard from "./MathMagicCard";
import { QUESTION_TYPES, type GameCardData, type QuestionData } from "./types";

interface MathMagicBoardProps {
  cards: GameCardData[];
  visibleIndices: number[];
  question: QuestionData | null;
  numberInput: string;
  isLocked: boolean;
  onColorAnswer: (colorName: string) => void;
  onDigit: (digit: string) => void;
  onClearNumberInput: () => void;
  onSubmitNumberInput: () => void;
}

const MathMagicBoard: React.FC<MathMagicBoardProps> = ({
  cards,
  visibleIndices,
  question,
  numberInput,
  isLocked,
  onColorAnswer,
  onDigit,
  onClearNumberInput,
  onSubmitNumberInput,
}) => {
  return (
    <motion.div
      key="game"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-3xl"
    >
      <div className="flex flex-wrap justify-center mb-6 gap-3 sm:gap-4 min-h-[140px]">
        {cards.map((card, index) => (
          <MathMagicCard
            key={card.id}
            card={card}
            isVisible={visibleIndices.includes(index)}
            isTarget={question?.targetIndices.includes(index)}
          />
        ))}
      </div>

      {question ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm max-w-md mx-auto"
        >
          <div className="text-center mb-4">
            <div className="inline-block p-3 rounded-xl bg-cyber-pink border-2 border-black/10 shadow-neo-sm mb-3">
              <Zap size={24} className="text-black fill-black" />
            </div>
            <h3 className="text-xl sm:text-2xl font-nunito font-black text-black dark:text-white uppercase tracking-tight">
              {question.text}
            </h3>
          </div>

          {question.type === QUESTION_TYPES.COLOR ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COLORS.map((color) => (
                <motion.button
                  key={color.name}
                  whileTap={!isLocked ? { scale: 0.96 } : undefined}
                  onClick={() => onColorAnswer(color.name)}
                  disabled={isLocked}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-black/10 shadow-neo-sm transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  title={color.name}
                >
                  <div
                    className="w-full h-12 rounded-xl border-2 border-black/10 shadow-neo-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs font-nunito font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {color.name}
                  </span>
                </motion.button>
              ))}
            </div>
          ) : (
            <GameNumpad
              value={numberInput}
              onDigit={onDigit}
              onDelete={onClearNumberInput}
              onSubmit={onSubmitNumberInput}
              submitLabel="DENETLE"
              disabled={isLocked}
              maxLength={MAX_NUMBER_INPUT_LENGTH}
              className="max-w-md mx-auto"
            />
          )}
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default MathMagicBoard;
