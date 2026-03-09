import React from "react";
import { Search } from "lucide-react";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import PuzzleMasterBoard from "./puzzleMaster/PuzzleMasterBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  TUZO_TEXT,
} from "./puzzleMaster/constants";
import { usePuzzleMasterController } from "./puzzleMaster/usePuzzleMasterController";

const PuzzleMasterGame: React.FC = () => {
  const {
    engine,
    feedback,
    selection,
    isLoading,
    levelData,
    setSelection,
    handleCheck,
  } = usePuzzleMasterController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        description: GAME_DESCRIPTION,
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-purple",
        icon: Search,
        wideLayout: true,
        howToPlay: [
          <span key="1"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-pink text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-2 mr-2">1</span> Sol taraftaki <strong>hedef parçayı</strong> dikkatlice incele</span>,
          <span key="2"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-yellow text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm -rotate-3 mr-2">2</span> Büyük tabloda <strong>bu parçanın yerini</strong> bul</span>,
          <span key="3"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-blue text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-1 mr-2">3</span> Seçim kutusunu <strong>sürükle</strong> ve kontrol et</span>
        ]
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full">
          {phase === "playing" ? (
            <PuzzleMasterBoard
              feedbackState={feedbackState}
              isLoading={isLoading}
              levelData={levelData}
              selection={selection}
              onCheck={handleCheck}
              onSelectionChange={setSelection}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default PuzzleMasterGame;
