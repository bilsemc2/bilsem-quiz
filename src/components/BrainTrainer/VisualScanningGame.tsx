import React from "react";
import { Eye } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./visualScanning/constants";
import { useVisualScanningController } from "./visualScanning/useVisualScanningController";
import VisualScanningBoard from "./visualScanning/VisualScanningBoard";

const VisualScanningGame: React.FC = () => {
  const { engine, feedback, handleCellClick, round, streak } =
    useVisualScanningController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Eye,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Üstte gösterilen hedef sembolü aklında tut",
      "Grid içindeki tüm hedef sembolleri en kısa sürede bulup dokun",
      "Yanlış tıklarsan can kaybedersin, dikkatli ol!",
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <VisualScanningBoard
          isFeedbackActive={feedback.isFeedbackActive}
          round={round}
          streak={streak}
          onCellClick={handleCellClick}
        />
      )}
    </BrainTrainerShell>
  );
};

export default VisualScanningGame;
