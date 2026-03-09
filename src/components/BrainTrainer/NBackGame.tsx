import React from "react";
import { Brain } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import NBackBoard from "./nBack/NBackBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./nBack/constants";
import { useNBackController } from "./nBack/useNBackController";

const NBackGame: React.FC = () => {
  const {
    engine,
    feedback,
    nValue,
    historyLength,
    currentShape,
    handleDecision,
  } = useNBackController();

  const gameConfig = {
    title: GAME_TITLE,
    icon: Brain,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    accentColor: "cyber-pink",
    howToPlay: [
      <span key="h1">
        Ekranda beliren şekilleri <strong>sırasıyla takip et</strong>
      </span>,
      <span key="h2">
        Gördüğün şekil <strong>N adım öncekiyle aynı mı?</strong>
      </span>,
      <span key="h3">
        Hızlı ve doğru karar vererek <strong>seviye atla</strong>
      </span>,
    ],
    extraHudItems: (
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl shadow-neo-sm">
        <Brain className="text-cyber-blue" size={18} strokeWidth={3} />
        <span className="font-nunito font-black text-black dark:text-white">
          N={nValue}
        </span>
      </div>
    ),
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <NBackBoard
          currentShape={currentShape}
          historyLength={historyLength}
          isFeedbackActive={feedback.isFeedbackActive}
          nValue={nValue}
          onDecision={handleDecision}
        />
      )}
    </BrainTrainerShell>
  );
};

export default NBackGame;
