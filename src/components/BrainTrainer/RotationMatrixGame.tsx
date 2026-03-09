import { RotateCw } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import RotationMatrixBoard from "./rotationMatrix/RotationMatrixBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./rotationMatrix/constants";
import { useRotationMatrixController } from "./rotationMatrix/useRotationMatrixController";

const RotationMatrixGame: React.FC = () => {
  const { engine, feedback, handleSelect, isLocked, round } =
    useRotationMatrixController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        description: GAME_DESCRIPTION,
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-purple",
        icon: RotateCw,
        backLink: "/atolyeler/tablet-degerlendirme",
        backLabel: "Tablet Değerlendirme",
        maxLevel: MAX_LEVEL,
        wideLayout: true,
        howToPlay: [
          <span key="1"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-pink text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-2 mr-2">1</span> 3x3 Izgaradaki şekillerin <strong>nasıl döndüğünü</strong> anla</span>,
          <span key="2"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-yellow text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm -rotate-3 mr-2">2</span> Soru işaretli yere gelmesi gereken <strong>doğru şekli</strong> bul</span>,
          <span key="3"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-blue text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-1 mr-2">3</span> 45°, 90° ve 135°'lik dönüş kurallarına <strong>odaklan</strong></span>
        ]
      }}
    >
      {() => (
        <RotationMatrixBoard
          isLocked={isLocked}
          onSelect={handleSelect}
          round={round}
        />
      )}
    </BrainTrainerShell>
  );
};

export default RotationMatrixGame;
