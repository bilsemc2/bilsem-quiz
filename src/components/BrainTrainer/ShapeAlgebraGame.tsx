import React from "react";
import { Brain } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import ShapeAlgebraBoard from "./shapeAlgebra/ShapeAlgebraBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./shapeAlgebra/constants";
import { useShapeAlgebraController } from "./shapeAlgebra/useShapeAlgebraController";

const ShapeAlgebraGame: React.FC = () => {
  const {
    engine,
    feedback,
    levelData,
    userAnswer,
    handleDigit,
    handleDelete,
    handleSubmit,
  } = useShapeAlgebraController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        icon: Brain,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "Her satırdaki şekillerin toplam değerini incele.",
          "Her şeklin hangi sayıya karşılık geldiğini mantık yürüterek bul.",
          "En alttaki soruda istenen toplam değeri klavyeden yaz.",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-blue",
        maxLevel: MAX_LEVEL,
      }}
    >
      {({ phase, level, feedbackState }) => (
        <div className="w-full flex-1 flex items-center justify-center p-2 sm:p-4">
          {phase === "playing" && levelData ? (
            <ShapeAlgebraBoard
              level={level}
              levelData={levelData}
              userAnswer={userAnswer}
              feedbackState={feedbackState}
              onDigit={handleDigit}
              onDelete={handleDelete}
              onSubmit={handleSubmit}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default ShapeAlgebraGame;
