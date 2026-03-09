import React from "react";
import { Grid3X3 } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import TargetGridBoard from "./targetGrid/TargetGridBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./targetGrid/constants";
import { useTargetGridController } from "./targetGrid/useTargetGridController";

const TargetGridGame: React.FC = () => {
  const {
    cards,
    currentSum,
    engine,
    feedback,
    handleCard,
    isPreview,
    previewTimer,
    selectedIndices,
    targetSum,
  } = useTargetGridController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        icon: Grid3X3,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "Sayıları kısa sürede ezberle - sonra gizlenecekler.",
          "Hedef sayıya ulaşan doğru kartları seç.",
          "Toplamı aşmamaya dikkat et - can kaybedersin.",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-blue",
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          {engine.phase === "playing" && cards.length > 0 && (
            <TargetGridBoard
              cards={cards}
              currentSum={currentSum}
              feedbackCorrect={feedback.feedbackState?.correct ?? null}
              isPreview={isPreview}
              onSelectCard={handleCard}
              previewTimer={previewTimer}
              selectedIndices={selectedIndices}
              targetSum={targetSum}
            />
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default TargetGridGame;
