import React from "react";
import { motion } from "framer-motion";
import { Check, Delete, Equal, Plus } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import ShapeAlgebraIcon from "./ShapeAlgebraIcon";
import type { LevelData, VariableDef } from "./types";

interface ShapeAlgebraBoardProps {
  level: number;
  levelData: LevelData;
  userAnswer: string;
  feedbackState: FeedbackState | null;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
}

const EquationRow = ({
  items,
  variables,
  result,
}: {
  items: { variableId: string }[];
  variables: Map<string, VariableDef>;
  result: number;
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map((item, index) => {
        const variable = variables.get(item.variableId);
        if (!variable) {
          return null;
        }

        return (
          <React.Fragment key={`${item.variableId}-${index}`}>
            {index > 0 ? (
              <Plus
                className="text-black dark:text-white"
                size={20}
                strokeWidth={3}
              />
            ) : null}
            <ShapeAlgebraIcon
              shape={variable.shape}
              color={variable.color}
              dotted={variable.dotted}
              size={36}
            />
          </React.Fragment>
        );
      })}
      <Equal
        className="text-black dark:text-white mx-1"
        size={22}
        strokeWidth={3}
      />
      <span className="text-2xl sm:text-3xl font-nunito font-black text-black dark:text-white drop-shadow-sm">
        {result}
      </span>
    </div>
  );
};

const ShapeAlgebraBoard: React.FC<ShapeAlgebraBoardProps> = ({
  level,
  levelData,
  userAnswer,
  feedbackState,
  onDigit,
  onDelete,
  onSubmit,
}) => {
  const variables = new Map(levelData.variables.map((variable) => [variable.id, variable]));

  return (
    <motion.div
      key={level}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 sm:gap-4 items-start">
        <div className="space-y-2">
          {levelData.equations.map((equation, index) => (
            <motion.div
              key={equation.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-center bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border-2 border-black/10 shadow-neo-sm"
            >
              <EquationRow
                items={equation.items}
                variables={variables}
                result={equation.result}
              />
            </motion.div>
          ))}

          <div className="bg-cyber-yellow border-2 border-black/10 rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3 shadow-neo-sm">
            <span className="text-black font-nunito font-black uppercase tracking-widest text-[10px] sm:text-xs bg-white border-2 border-black/10 px-3 py-1 rounded-lg shadow-neo-sm">
              {levelData.question.text}
            </span>

            <div className="flex flex-wrap justify-center gap-2 items-center w-full">
              <div className="flex flex-wrap justify-center gap-2">
                {levelData.question.items.map((item, index) => {
                  const variable = variables.get(item.variableId);
                  if (!variable) {
                    return null;
                  }

                  return (
                    <React.Fragment key={`${item.variableId}-${index}`}>
                      {index > 0 ? (
                        <Plus className="text-black" size={22} strokeWidth={3} />
                      ) : null}
                      <ShapeAlgebraIcon
                        shape={variable.shape}
                        color={variable.color}
                        dotted={variable.dotted}
                        size={40}
                      />
                    </React.Fragment>
                  );
                })}
              </div>

              <Equal className="text-black" size={26} strokeWidth={3} />

              <div
                className={`w-20 sm:w-24 h-14 sm:h-16 rounded-xl border-2 flex items-center justify-center text-3xl sm:text-4xl font-nunito font-black transition-all shadow-inner ${
                  feedbackState
                    ? feedbackState.correct
                      ? "bg-cyber-green border-black/10 text-black"
                      : "bg-cyber-pink border-black/10 text-black"
                    : "bg-white border-black/10 text-black"
                }`}
              >
                {userAnswer ? (
                  userAnswer
                ) : (
                  <span className="text-black/20 animate-pulse">?</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full md:w-56">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((key) => (
            <motion.button
              key={key}
              whileTap={!feedbackState ? { scale: 0.95 } : undefined}
              onClick={() => onDigit(key)}
              disabled={!!feedbackState}
              className={`py-3 sm:py-3.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-black/10 text-xl sm:text-2xl font-nunito font-black text-black dark:text-white shadow-neo-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 active:translate-y-0.5 active:shadow-none transition-all ${
                key === "0" ? "col-start-2" : ""
              }`}
            >
              {key}
            </motion.button>
          ))}

          <motion.button
            whileTap={!feedbackState ? { scale: 0.95 } : undefined}
            onClick={onDelete}
            disabled={!!feedbackState}
            className="py-3 sm:py-3.5 rounded-xl bg-cyber-pink border-2 border-black/10 text-black flex items-center justify-center col-start-1 row-start-4 shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Delete size={24} />
          </motion.button>

          <motion.button
            whileTap={userAnswer && !feedbackState ? { scale: 0.95 } : undefined}
            onClick={onSubmit}
            disabled={!userAnswer || !!feedbackState}
            className="py-3 sm:py-3.5 rounded-xl bg-cyber-green border-2 border-black/10 text-black flex items-center justify-center col-start-3 row-start-4 shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
          >
            <Check size={24} strokeWidth={3} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ShapeAlgebraBoard;
