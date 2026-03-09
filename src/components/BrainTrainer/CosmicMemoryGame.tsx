import React from "react";
import { Star } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import CosmicMemoryBoard from "./cosmicMemory/CosmicMemoryBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./cosmicMemory/constants";
import { useCosmicMemoryController } from "./cosmicMemory/useCosmicMemoryController";

const CosmicMemoryGame: React.FC = () => {
  const { displayedCell, engine, feedback, handleCellClick, localPhase, round, userSequence } =
    useCosmicMemoryController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Star,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    howToPlay: [
      "Parlayan yıldızların sırasını dikkatle izle",
      "NORMAL modda aynı sırada, REVERSE modda ters sırada tıkla",
      "Sırayı bozmadan tüm yıldızları doğru sırayla işaretle"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {({ phase }) => (
        <div className="relative z-10 w-full flex flex-col items-center justify-center flex-1 p-2">
          {phase === "playing" && round ? (
            <CosmicMemoryBoard
              displayedCell={displayedCell}
              level={engine.level}
              localPhase={localPhase}
              onCellClick={handleCellClick}
              round={round}
              userSequence={userSequence}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default CosmicMemoryGame;
