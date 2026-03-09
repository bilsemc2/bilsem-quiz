import { TrendingUp } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import InvisibleTowerBoard from "./invisibleTower/InvisibleTowerBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./invisibleTower/constants";
import { useInvisibleTowerController } from "./invisibleTower/useInvisibleTowerController";

const InvisibleTowerGame: React.FC = () => {
  const {
    currentIndex,
    engine,
    feedback,
    handleSelect,
    isLocked,
    localPhase,
    options,
    tower,
  } = useInvisibleTowerController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: TrendingUp,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Bloklarda parlayan sayıları dikkatle takip et.",
      "Sayıları zihninde toplayarak ilerle (Eksilere DİKKAT!).",
      "20 katı başarıyla tırmanarak kule fatihi ol!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {({ phase }) =>
        phase === "playing" ? (
          <InvisibleTowerBoard
            currentIndex={currentIndex}
            isLocked={isLocked}
            localPhase={localPhase}
            onSelect={handleSelect}
            options={options}
            tower={tower}
          />
        ) : null
      }
    </BrainTrainerShell>
  );
};

export default InvisibleTowerGame;
