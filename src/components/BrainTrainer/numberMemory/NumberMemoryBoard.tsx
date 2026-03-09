import NumberMemoryListeningView from "./NumberMemoryListeningView";
import NumberMemoryQuestionView from "./NumberMemoryQuestionView";
import type { LocalPhase, Question } from "./types";

interface NumberMemoryBoardProps {
  currentPlayIndex: number;
  localPhase: LocalPhase;
  numberSequence: number[];
  onAnswer: (value: number) => void;
  question: Question | null;
  selectedAnswer: number | null;
}

const NumberMemoryBoard = ({
  currentPlayIndex,
  localPhase,
  numberSequence,
  onAnswer,
  question,
  selectedAnswer,
}: NumberMemoryBoardProps) => {
  if (localPhase === "listening") {
    return (
      <NumberMemoryListeningView
        currentPlayIndex={currentPlayIndex}
        numberSequence={numberSequence}
      />
    );
  }

  if (localPhase === "question" && question) {
    return (
      <NumberMemoryQuestionView
        onAnswer={onAnswer}
        question={question}
        selectedAnswer={selectedAnswer}
      />
    );
  }

  return null;
};

export default NumberMemoryBoard;
