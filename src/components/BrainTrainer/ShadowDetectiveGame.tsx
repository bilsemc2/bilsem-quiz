import React from "react";
import { Search } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import ShadowDetectiveBoard from "./shadowDetective/ShadowDetectiveBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./shadowDetective/constants";
import { useShadowDetectiveController } from "./shadowDetective/useShadowDetectiveController";

const ShadowDetectiveGame: React.FC = () => {
  const {
    engine,
    feedback,
    round,
    roundStatus,
    previewTimer,
    selectedIndex,
    handleSelect,
  } = useShadowDetectiveController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        icon: Search,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "Ekrana gelen deseni 3 saniye boyunca dikkatle incele.",
          "Aşağıdaki 4 seçenek arasından tıpatıp aynısını bul.",
          "Renk, dönüş ve konum farklarını bir dedektif gibi yakala.",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-purple",
        maxLevel: MAX_LEVEL,
        wideLayout: true,
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="w-full flex-1 flex items-center justify-center p-2 sm:p-4">
          {phase === "playing" && round ? (
            <ShadowDetectiveBoard
              round={round}
              roundStatus={roundStatus}
              previewTimer={previewTimer}
              selectedIndex={selectedIndex}
              feedbackState={feedbackState}
              onSelect={handleSelect}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default ShadowDetectiveGame;
