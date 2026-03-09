import React from "react";
import { Shapes } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./symbolMatch/constants";
import SymbolMatchBoard from "./symbolMatch/SymbolMatchBoard";
import { useSymbolMatchController } from "./symbolMatch/useSymbolMatchController";

const SymbolMatchGame: React.FC = () => {
  const {
    engine,
    feedback,
    localPhase,
    symbolColors,
    currentQuestion,
    memorizeCountdown,
    memorizeDuration,
    selectedAnswer,
    handleAnswer,
  } = useSymbolMatchController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Shapes,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    howToPlay: [
      "Ekrana gelen renkli şekilleri ezberle",
      "Sana sorulan şekli veya rengi bul",
      "Seviye ilerledikçe şekil sayısı artar, süre azalır!",
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <SymbolMatchBoard
          currentQuestion={currentQuestion}
          localPhase={localPhase}
          memorizeCountdown={memorizeCountdown}
          memorizeDuration={memorizeDuration}
          onAnswer={handleAnswer}
          selectedAnswer={selectedAnswer}
          symbolColors={symbolColors}
        />
      )}
    </BrainTrainerShell>
  );
};

export default SymbolMatchGame;
