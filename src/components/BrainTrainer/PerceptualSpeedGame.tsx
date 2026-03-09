import React from "react";
import { Eye } from "lucide-react";

import PerceptualSpeedBoard from "./perceptualSpeed/PerceptualSpeedBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./perceptualSpeed/constants";
import { usePerceptualSpeedController } from "./perceptualSpeed/usePerceptualSpeedController";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const PerceptualSpeedGame: React.FC = () => {
  const { challenge, correctInLevel, engine, feedback, handleAnswer } =
    usePerceptualSpeedController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    accentColor: "cyber-blue",
    icon: Eye,
    maxLevel: MAX_LEVEL,
    howToPlay: [
      <span key="h1">
        Ekrandaki iki sayı dizisini <strong>hızlıca tara</strong>
      </span>,
      <span key="h2">
        Aynıysa <strong>AYNI</strong>, farklıysa <strong>FARKLI</strong> seç
      </span>,
      <span key="h3">
        Karıştırılan rakamlara (3-8, 1-7) <strong>dikkat et</strong>
      </span>,
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <PerceptualSpeedBoard
          challenge={challenge}
          correctInLevel={correctInLevel}
          isFeedbackActive={feedback.isFeedbackActive}
          onAnswer={handleAnswer}
        />
      )}
    </BrainTrainerShell>
  );
};

export default PerceptualSpeedGame;
