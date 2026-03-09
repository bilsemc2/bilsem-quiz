import { Grid3X3 } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import MatrixEchoBoard from "./matrixEcho/MatrixEchoBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./matrixEcho/constants";
import { useMatrixEchoController } from "./matrixEcho/useMatrixEchoController";

const MatrixEchoGame: React.FC = () => {
  const { cells, engine, feedback, handleAnswer, isLocked, question, subPhase } =
    useMatrixEchoController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Grid3X3,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Matristeki sayıların yerlerini ezberle",
      "Sayılar gizlendikten sonra gelen soruyu oku",
      "Doğru seçeneği işaretleyerek puanları topla"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <MatrixEchoBoard
          cells={cells}
          isLocked={isLocked}
          onAnswer={handleAnswer}
          question={question}
          subPhase={subPhase}
        />
      )}
    </BrainTrainerShell>
  );
};

export default MatrixEchoGame;
