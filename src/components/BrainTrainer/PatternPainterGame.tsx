import React from "react";
import { Palette } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import PatternPainterBoard from "./patternPainter/PatternPainterBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./patternPainter/constants";
import { usePatternPainterController } from "./patternPainter/usePatternPainterController";

const PatternPainterGame: React.FC = () => {
  const {
    engine,
    feedback,
    currentLevel,
    userPainting,
    activeColor,
    availableColors,
    canCheck,
    handleCheck,
    handleClearPainting,
    handlePaintTile,
    handleSelectColor,
  } = usePatternPainterController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Palette,
    accentColor: "cyber-pink",
    wideLayout: true,
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Büyük desendeki kuralı anlamaya çalış",
      "Renk paletinden uygun renkleri seçerek boşluğu boya",
      "Tüm kutuları boyayınca kontrol et butonuna bas",
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {({ phase }) => (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-2 w-full max-w-5xl mx-auto">
          {phase === "playing" && currentLevel ? (
            <PatternPainterBoard
              activeColor={activeColor}
              availableColors={availableColors}
              canCheck={canCheck}
              currentLevel={currentLevel}
              userPainting={userPainting}
              onCheck={handleCheck}
              onClear={handleClearPainting}
              onPaintTile={handlePaintTile}
              onSelectColor={handleSelectColor}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default PatternPainterGame;
