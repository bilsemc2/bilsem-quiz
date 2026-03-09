import React from "react";
import { FlipHorizontal } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import ReflectionSumBoard from "./reflectionSum/ReflectionSumBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  TUZO_TEXT,
} from "./reflectionSum/constants";
import { useReflectionSumController } from "./reflectionSum/useReflectionSumController";

const ReflectionSumGame: React.FC = () => {
  const {
    currentIndex,
    digits,
    engine,
    feedback,
    handleDigitClick,
    handleSumSubmit,
    isMirrored,
    setUserSum,
    status,
    userSequence,
    userSum,
  } = useReflectionSumController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        description: GAME_DESCRIPTION,
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-purple",
        icon: FlipHorizontal,
        wideLayout: true,
        howToPlay: [
          <span key="1"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-pink text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-2 mr-2">1</span> Sırayla ekrana gelen <strong>sayıları aklında tut</strong></span>,
          <span key="2"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-yellow text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm -rotate-3 mr-2">2</span> Gördüğün sayıları <strong>en sondan başa doğru</strong> tuşla</span>,
          <span key="3"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-blue text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-1 mr-2">3</span> Son aşamada tüm sayıların <strong>toplamını hesapla</strong></span>
        ]
      }}
    >
      {({ phase }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full">
          {phase === "playing" && digits.length > 0 && (
            <ReflectionSumBoard
              currentIndex={currentIndex}
              digits={digits}
              isMirrored={isMirrored}
              onDigitClick={handleDigitClick}
              onSubmitSum={handleSumSubmit}
              onUserSumChange={setUserSum}
              status={status}
              userSequence={userSequence}
              userSum={userSum}
            />
          )}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default ReflectionSumGame;
