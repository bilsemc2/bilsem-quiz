import React from "react";
import { Eye } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import VisualMemoryBoard from "./visualMemory/VisualMemoryBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./visualMemory/constants";
import { useVisualMemoryController } from "./visualMemory/useVisualMemoryController";

const VisualMemoryGame: React.FC = () => {
  const {
    engine,
    feedback,
    internalPhase,
    round,
    userSelectedId,
    memTimeLeft,
    memTimeMax,
    handleCellClick,
  } = useVisualMemoryController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        icon: Eye,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "Izgarayı dikkatlice incele ve şekilleri ezberle.",
          "Süre bitince ızgara kapanacak ve kısa bir süre sonra geri açılacak.",
          "Izgara tekrar açıldığında değişen şekli bul ve tıkla.",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-blue",
        maxLevel: MAX_LEVEL,
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="w-full flex justify-center items-center flex-1 h-full pt-4 pb-24 sm:pb-4">
          {phase === "playing" && round ? (
            <VisualMemoryBoard
              level={engine.level}
              round={round}
              internalPhase={internalPhase}
              memTimeLeft={memTimeLeft}
              memTimeMax={memTimeMax}
              userSelectedId={userSelectedId}
              feedbackState={feedbackState}
              onSelectCell={handleCellClick}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default VisualMemoryGame;
