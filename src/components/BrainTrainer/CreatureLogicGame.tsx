import React from "react";
import { Sparkles } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import CreatureLogicBoard from "./creatureLogic/CreatureLogicBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./creatureLogic/constants";
import { useCreatureLogicController } from "./creatureLogic/useCreatureLogicController";

const CreatureLogicGame: React.FC = () => {
  const {
    engine,
    feedback,
    round,
    selectedIds,
    handleCreatureClick,
    handleSubmit,
  } = useCreatureLogicController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        icon: Sparkles,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "Üstteki renkli yönergeyi dikkatle oku.",
          "Şartı sağlayan yaratıkların hepsini seç.",
          "Tüm seçimlerin bittikten sonra onayla.",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-blue",
        maxLevel: MAX_LEVEL,
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2">
          {phase === "playing" && round ? (
            <CreatureLogicBoard
              round={round}
              selectedIds={selectedIds}
              feedbackState={feedbackState}
              onToggleCreature={handleCreatureClick}
              onSubmit={handleSubmit}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default CreatureLogicGame;
