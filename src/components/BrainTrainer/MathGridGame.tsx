import React from "react";
import { Grid3X3 } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import MathGridBoard from "./mathGrid/MathGridBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./mathGrid/constants";
import { useMathGridController } from "./mathGrid/useMathGridController";

const MathGridGame: React.FC = () => {
  const {
    activeCell,
    engine,
    feedback,
    grid,
    handleCellClick,
    handleDelete,
    handleNumberInput,
    handleSubmit,
    ruleDescription,
    showErrors,
  } = useMathGridController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Grid3X3,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Satırlardaki sayıların birbirine nasıl dönüştüğünü bul.",
      "Soru işareti olan hücrelere tıkla ve sayıyı gir.",
      "Tüm hücreleri doldurduktan sonra Kontrol Et butonuna bas!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-sm mx-auto">
          {engine.phase === "playing" && grid.length > 0 && (
            <MathGridBoard
              activeCell={activeCell}
              grid={grid}
              onCellClick={handleCellClick}
              onDelete={handleDelete}
              onNumberInput={handleNumberInput}
              onSubmit={handleSubmit}
              ruleDescription={ruleDescription}
              showErrors={showErrors}
            />
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default MathGridGame;
