import { motion } from "framer-motion";

import SymbolSearchAnswerButtons from "./SymbolSearchAnswerButtons";
import SymbolSearchGroupPanel from "./SymbolSearchGroupPanel";
import SymbolSearchTargetPanel from "./SymbolSearchTargetPanel";
import type { RoundData } from "./types";

interface SymbolSearchBoardProps {
  feedbackCorrect: boolean | null;
  onAnswer: (answer: boolean) => void;
  round: RoundData;
  userSelectedAnswer: boolean | null;
}

const SymbolSearchBoard = ({
  feedbackCorrect,
  onAnswer,
  round,
  userSelectedAnswer,
}: SymbolSearchBoardProps) => (
  <motion.div
    key="playing"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="w-full flex flex-col gap-5"
  >
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
      <div className="md:col-span-4">
        <SymbolSearchTargetPanel round={round} />
      </div>
      <div className="md:col-span-8">
        <SymbolSearchGroupPanel feedbackCorrect={feedbackCorrect} round={round} />
      </div>
    </div>

    <SymbolSearchAnswerButtons
      feedbackCorrect={feedbackCorrect}
      hasTarget={round.hasTarget}
      onAnswer={onAnswer}
      userSelectedAnswer={userSelectedAnswer}
    />
  </motion.div>
);

export default SymbolSearchBoard;
