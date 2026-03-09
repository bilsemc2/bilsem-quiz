import React from "react";
import { Grid3X3 } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import CrossMatchBoard from "./crossMatch/CrossMatchBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./crossMatch/constants";
import { useCrossMatchController } from "./crossMatch/useCrossMatchController";

const CrossMatchGame: React.FC = () => {
  const { cards, engine, feedback, handleCardClick, localPhase } =
    useCrossMatchController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Grid3X3,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    howToPlay: [
      "Kartları 3 saniye boyunca ezberle.",
      "Aynı renk ve şekle sahip kartları eşleştir.",
      "İleri seviyelerde kartların yer değişimini takip et!",
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <CrossMatchBoard
          cards={cards}
          isFeedbackActive={feedback.isFeedbackActive}
          localPhase={localPhase}
          onCardClick={handleCardClick}
        />
      )}
    </BrainTrainerShell>
  );
};

export default CrossMatchGame;
