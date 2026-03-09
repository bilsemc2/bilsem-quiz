import { Pencil } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import PencilStroopBoard from "./pencilStroop/PencilStroopBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./pencilStroop/constants";
import { usePencilStroopController } from "./pencilStroop/usePencilStroopController";


const PencilStroopGame: React.FC = () => {
  const { currentRound, engine, feedback, handleAnswer, isLocked, selectedAnswer } =
    usePencilStroopController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Pencil,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      <>Ekrandaki <strong>kalemin rengine</strong> bak, yazıya ve renklere aldanma</>,
      <>Butonların renkleri seni yanıltmaya çalışacak, dikkatli ol!</>,
      <>Zihinsel çelişkiyi yen ve <strong>en doğru kararı</strong> hızlıca ver</>,
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <PencilStroopBoard
          currentRound={currentRound}
          selectedAnswer={selectedAnswer}
          isLocked={isLocked}
          onAnswer={handleAnswer}
        />
      )}
    </BrainTrainerShell>
  );
};

export default PencilStroopGame;
