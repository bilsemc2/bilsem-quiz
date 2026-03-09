import React from "react";

import SymbolMatchMemorizeView from "./SymbolMatchMemorizeView";
import SymbolMatchQuestionView from "./SymbolMatchQuestionView";
import type {
  QuestionData,
  ShapeColorAssignment,
  SymbolMatchPhase,
} from "./types";

interface SymbolMatchBoardProps {
  localPhase: SymbolMatchPhase;
  symbolColors: ShapeColorAssignment[];
  currentQuestion: QuestionData | null;
  memorizeCountdown: number;
  memorizeDuration: number;
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
}

const SymbolMatchBoard: React.FC<SymbolMatchBoardProps> = ({
  currentQuestion,
  localPhase,
  memorizeCountdown,
  memorizeDuration,
  onAnswer,
  selectedAnswer,
  symbolColors,
}) => {
  return (
    <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center p-4 flex-1 mb-4 w-full max-w-4xl mx-auto">
      {localPhase === "memorize" ? (
        <SymbolMatchMemorizeView
          memorizeCountdown={memorizeCountdown}
          memorizeDuration={memorizeDuration}
          symbolColors={symbolColors}
        />
      ) : currentQuestion ? (
        <SymbolMatchQuestionView
          currentQuestion={currentQuestion}
          selectedAnswer={selectedAnswer}
          onAnswer={onAnswer}
        />
      ) : null}
    </div>
  );
};

export default SymbolMatchBoard;
