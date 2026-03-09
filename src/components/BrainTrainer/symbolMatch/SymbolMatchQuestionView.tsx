import React from "react";
import { motion } from "framer-motion";

import { COLOR_OPTIONS, SHAPE_DEFINITIONS } from "./constants";
import { SHAPE_ICON_MAP } from "./shapeIcons";
import type { QuestionData } from "./types";

const SHAPE_BY_NAME = new Map<string, (typeof SHAPE_DEFINITIONS)[number]>(
  SHAPE_DEFINITIONS.map((shapeDefinition) => [
    shapeDefinition.name,
    shapeDefinition,
  ]),
);

const COLOR_HEX_BY_NAME = new Map<string, string>(
  COLOR_OPTIONS.map((colorOption) => [colorOption.name, colorOption.hex]),
);

interface SymbolMatchQuestionViewProps {
  currentQuestion: QuestionData;
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
}

const SymbolMatchQuestionView: React.FC<SymbolMatchQuestionViewProps> = ({
  currentQuestion,
  selectedAnswer,
  onAnswer,
}) => {
  return (
    <motion.div
      key="question"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 w-full max-w-4xl"
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-2 border-black/10 shadow-neo-sm rotate-1">
        <p className="text-cyber-blue text-sm font-nunito font-black uppercase tracking-widest mb-3">
          Zihin Sorusu
        </p>
        <h2 className="text-2xl lg:text-3xl font-nunito font-black text-black dark:text-white leading-tight">
          {currentQuestion.query}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const optionColor = COLOR_HEX_BY_NAME.get(option) ?? "#64748b";
          const optionShape =
            currentQuestion.type === "color" ? SHAPE_BY_NAME.get(option) : null;
          const targetShape =
            currentQuestion.type === "symbol" && currentQuestion.targetShapeName
              ? SHAPE_BY_NAME.get(currentQuestion.targetShapeName)
              : null;

          return (
            <motion.button
              key={`${option}-${index}`}
              onClick={() => onAnswer(option)}
              disabled={selectedAnswer !== null}
              whileTap={selectedAnswer ? {} : { scale: 0.95 }}
              className={`relative py-6 sm:py-8 rounded-3xl font-nunito font-black text-xl sm:text-2xl transition-all border-4 flex flex-col items-center justify-center gap-3 overflow-hidden shadow-neo-sm hover:shadow-neo-sm active:translate-y-2 active:shadow-none bg-white dark:bg-slate-700 border-black/10 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 ${index % 2 === 0 ? "rotate-1 hover:rotate-2" : "-rotate-1 hover:-rotate-2"} ${isSelected ? "border-cyber-pink shadow-none translate-y-2" : ""}`}
            >
              {currentQuestion.type === "color" && optionShape ? (
                <>
                  {(() => {
                    const ShapeIcon = SHAPE_ICON_MAP[optionShape.key];

                    return (
                      <ShapeIcon
                        size={56}
                        style={{
                          color: "black",
                          filter: "drop-shadow(2px 2px 0px rgba(0,0,0,0.3))",
                        }}
                        fill={optionShape.fill ? "black" : "none"}
                        strokeWidth={2}
                        className="dark:text-white dark:fill-white"
                      />
                    );
                  })()}
                  <span>{option}</span>
                </>
              ) : currentQuestion.type === "symbol" ? (
                <>
                  {targetShape ? (
                    (() => {
                      const ShapeIcon = SHAPE_ICON_MAP[targetShape.key];

                      return (
                        <ShapeIcon
                          size={48}
                          style={{
                            color: optionColor,
                            filter: "drop-shadow(2px 2px 0px rgba(0,0,0,0.3))",
                          }}
                          fill={targetShape.fill ? optionColor : "none"}
                          strokeWidth={2}
                        />
                      );
                    })()
                  ) : null}
                  <span
                    style={{ color: optionColor }}
                    className="px-3 bg-white border-2 border-black/10 rounded-lg text-sm"
                  >
                    {option}
                  </span>
                </>
              ) : (
                <span>{option}</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SymbolMatchQuestionView;
