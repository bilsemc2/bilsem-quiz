import { Scale } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import VisualAlgebraBoard from "./visualAlgebra/VisualAlgebraBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./visualAlgebra/constants";
import { useVisualAlgebraController } from "./visualAlgebra/useVisualAlgebraController";

const VisualAlgebraGame: React.FC = () => {
  const {
    availableShapes,
    engine,
    feedback,
    handleAddShape,
    handleCheckAnswer,
    handleRemoveShape,
    handleResetPan,
    levelData,
    showWeights,
    toggleWeights,
    userRightPan,
  } = useVisualAlgebraController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        icon: Scale,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "Üstteki referans teraziye bakarak ağırlıkları bul",
          "Alttaki soru terazisine şekiller ekle",
          "Her iki kefedeki ağırlıklar eşitlendiğinde kontrol et",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-blue",
        wideLayout: true,
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <VisualAlgebraBoard
          availableShapes={availableShapes}
          feedbackState={feedback.feedbackState}
          level={engine.level}
          levelData={levelData}
          onAddShape={handleAddShape}
          onCheckAnswer={handleCheckAnswer}
          onRemoveShape={handleRemoveShape}
          onResetPan={handleResetPan}
          showWeights={showWeights}
          toggleWeights={toggleWeights}
          userRightPan={userRightPan}
        />
      )}
    </BrainTrainerShell>
  );
};

export default VisualAlgebraGame;
