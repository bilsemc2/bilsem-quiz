import React from "react";
import { Search } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import WordHuntBoard from "./wordHunt/WordHuntBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./wordHunt/constants";
import { useWordHuntController } from "./wordHunt/useWordHuntController";

const WordHuntGame: React.FC = () => {
  const {
    engine,
    feedback,
    round,
    selectedIds,
    roundTimeLeft,
    internalPhase,
    handleToggle,
  } = useWordHuntController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        icon: Search,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "Ortada beliren hedef harfi ya da heceyi hızla öğren.",
          "Kelimeler açıldığında hedefi içerenleri seç.",
          "Süre bitmeden tüm doğru hedefleri bul.",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-pink",
        maxLevel: MAX_LEVEL,
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="w-full flex-1 flex justify-center items-center p-2 sm:p-4">
          {phase === "playing" && round ? (
            <WordHuntBoard
              round={round}
              selectedIds={selectedIds}
              roundTimeLeft={roundTimeLeft}
              internalPhase={internalPhase}
              feedbackState={feedbackState}
              onToggle={handleToggle}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default WordHuntGame;
