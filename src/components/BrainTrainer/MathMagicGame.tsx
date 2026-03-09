import React from "react";
import { Zap } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import MathMagicBoard from "./mathMagic/MathMagicBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./mathMagic/constants";
import { useMathMagicController } from "./mathMagic/useMathMagicController";

const MathMagicGame: React.FC = () => {
  const {
    engine,
    feedback,
    cards,
    visibleIndices,
    question,
    numberInput,
    answerColor,
    handleDigit,
    clearNumberInput,
    submitNumberInput,
  } = useMathMagicController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Zap,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Ekranda sıra ile açılan kartları ezberle.",
      "Kartların rengini, sayısını ve sırasını aklında tut.",
      "İşaretlenen kart hakkındaki mantık sorularını cevapla!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full">
          {phase === "playing" ? (
            <MathMagicBoard
              cards={cards}
              visibleIndices={visibleIndices}
              question={question}
              numberInput={numberInput}
              isLocked={!!feedbackState}
              onColorAnswer={answerColor}
              onDigit={handleDigit}
              onClearNumberInput={clearNumberInput}
              onSubmitNumberInput={submitNumberInput}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default MathMagicGame;
