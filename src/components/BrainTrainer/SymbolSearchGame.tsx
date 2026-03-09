import React from "react";
import { ScanSearch } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import SymbolSearchBoard from "./symbolSearch/SymbolSearchBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./symbolSearch/constants";
import { useSymbolSearchController } from "./symbolSearch/useSymbolSearchController";

const SymbolSearchGame: React.FC = () => {
  const {
    engine,
    feedback,
    feedbackCorrect,
    handleAnswer,
    round,
    userSelectedAnswer,
  } = useSymbolSearchController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: ScanSearch,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    howToPlay: [
      "Hedef sembolü aklında tut",
      "Grupta varsa VAR, yoksa YOK butonuna tıkla",
      "Hızlı tepki vererek daha fazla puan kazan!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full max-w-7xl mx-auto">
          {round && (
            <SymbolSearchBoard
              feedbackCorrect={feedbackCorrect}
              onAnswer={handleAnswer}
              round={round}
              userSelectedAnswer={userSelectedAnswer}
            />
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default SymbolSearchGame;
