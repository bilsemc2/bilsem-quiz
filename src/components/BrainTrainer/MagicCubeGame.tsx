import React from "react";
import { Box } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./magicCube/constants";
import MagicCubeBoard from "./magicCube/MagicCubeBoard";
import { useMagicCubeController } from "./magicCube/useMagicCubeController";

const MagicCubeGame: React.FC = () => {
  const {
    engine,
    feedback,
    facesData,
    isFolding,
    net,
    options,
    handleSelect,
    toggleFolding,
  } = useMagicCubeController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Box,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    backLink: "/atolyeler/tablet-degerlendirme",
    backLabel: "Tablet Değerlendirme",
    wideLayout: true,
    howToPlay: [
      "Küp açınımını dikkatle incele.",
      "Harita üzerindeki sembolleri zihninde eşleştir.",
      "Katlandığında hangi küpün oluşacağını işaretle."
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {({ phase }) => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-5xl mx-auto">
          {phase === "playing" && facesData ? (
            <MagicCubeBoard
              facesData={facesData}
              isFolding={isFolding}
              net={net}
              options={options}
              onSelect={handleSelect}
              onToggleFolding={toggleFolding}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default MagicCubeGame;
