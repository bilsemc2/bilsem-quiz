import React from "react";
import { Eye } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import SpotDifferenceBoard from "./spotDifference/SpotDifferenceBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./spotDifference/constants";
import { useSpotDifferenceController } from "./spotDifference/useSpotDifferenceController";

const SpotDifferenceGame: React.FC = () => {
  const {
    engine,
    feedback,
    roundData,
    tiles,
    roundTimeLeft,
    selectedIndex,
    handlePick,
  } = useSpotDifferenceController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        icon: Eye,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "Ekrana gelen grid içindeki farklı kareyi bul.",
          "Her round için üstteki süre barı dolmadan tıkla.",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-yellow",
        maxLevel: MAX_LEVEL,
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="w-full h-full flex flex-col items-center justify-center">
          {phase === "playing" && roundData ? (
            <SpotDifferenceBoard
              roundData={roundData}
              tiles={tiles}
              roundTimeLeft={roundTimeLeft}
              selectedIndex={selectedIndex}
              feedbackState={feedbackState}
              onPick={handlePick}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default SpotDifferenceGame;
