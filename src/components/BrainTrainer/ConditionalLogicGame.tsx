import React from "react";
import { BrainCircuit } from "lucide-react";

import ConditionalLogicBoard from "./conditionalLogic/ConditionalLogicBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./conditionalLogic/constants";
import { useConditionalLogicController } from "./conditionalLogic/useConditionalLogicController";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const ConditionalLogicGame: React.FC = () => {
  const { engine, feedback, round, selectedId, handleObjectClick } =
    useConditionalLogicController();

  return (
    <BrainTrainerShell
      config={{
        title: GAME_TITLE,
        description: GAME_DESCRIPTION,
        tuzoCode: TUZO_TEXT,
        icon: BrainCircuit,
        accentColor: "cyber-blue",
        maxLevel: MAX_LEVEL,
        howToPlay: [
          "Ekrandaki koşullu yönergeyi dikkatle oku.",
          "Sahnedeki nesnelere bakarak koşulun doğru olup olmadığını test et.",
          "Koşul doğruysa ilk hedefi, yanlışsa ikinci hedefi seç.",
        ],
      }}
      engine={engine}
      feedback={feedback}
    >
      {({ phase }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1">
          {phase === "playing" && round ? (
            <ConditionalLogicBoard
              round={round}
              selectedId={selectedId}
              onSelectObject={handleObjectClick}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default ConditionalLogicGame;
