import React from "react";

import NBackDecisionButtons from "./NBackDecisionButtons";
import NBackShapeDisplay from "./NBackShapeDisplay";
import type { ShapeData } from "./types";

interface NBackBoardProps {
  currentShape: ShapeData | null;
  historyLength: number;
  nValue: number;
  isFeedbackActive: boolean;
  onDecision: (isSame: boolean) => void;
}

const NBackBoard: React.FC<NBackBoardProps> = ({
  currentShape,
  historyLength,
  isFeedbackActive,
  nValue,
  onDecision,
}) => {
  const missingCount = Math.max(nValue - historyLength, 0);
  const canAnswer = historyLength >= nValue && currentShape !== null;

  return (
    <>
      <NBackShapeDisplay currentShape={currentShape} missingCount={missingCount} />
      {canAnswer ? (
        <NBackDecisionButtons
          disabled={isFeedbackActive}
          onDecision={onDecision}
        />
      ) : null}
    </>
  );
};

export default NBackBoard;
