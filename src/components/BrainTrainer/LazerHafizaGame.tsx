import React from "react";
import { Crosshair } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import LazerHafizaBoard from "./lazerHafiza/LazerHafizaBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./lazerHafiza/constants";
import { useLazerHafizaController } from "./lazerHafiza/useLazerHafizaController";

const LazerHafizaGame: React.FC = () => {
  const {
    engine,
    feedback,
    levelConfig,
    localPhase,
    path,
    userPath,
    visiblePathIndex,
    handleCellClick,
  } = useLazerHafizaController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Crosshair,
    accentColor: "cyber-green",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Lazer ışını noktalar arasında bir yol çizer — dikkatle izle",
      "Işın kaybolunca noktaları sırasıyla tıklayarak yolu yeniden oluştur",
      "Seviye ilerledikçe grid büyür, yol uzar, çapraz geçişler eklenir!",
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <LazerHafizaBoard
          feedbackState={feedback.feedbackState}
          levelConfig={levelConfig}
          localPhase={localPhase}
          path={path}
          userPath={userPath}
          visiblePathIndex={visiblePathIndex}
          onCellClick={handleCellClick}
        />
      )}
    </BrainTrainerShell>
  );
};

export default LazerHafizaGame;
