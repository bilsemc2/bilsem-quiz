import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Zap } from "lucide-react";

import type { FeedbackState } from "../../../hooks/useGameFeedback";
import { GAME_COLORS } from "../shared/gameColors";
import { buildSvgPath } from "./logic";
import LazerHafizaStatus from "./LazerHafizaStatus";
import { useResponsiveCanvasSize } from "./useResponsiveCanvasSize";
import type { Coordinate, LevelConfig, LocalPhase } from "./types";

interface LazerHafizaBoardProps {
  feedbackState: FeedbackState | null;
  levelConfig: LevelConfig;
  localPhase: LocalPhase;
  path: Coordinate[];
  userPath: Coordinate[];
  visiblePathIndex: number;
  onCellClick: (row: number, col: number) => void;
}

const LazerHafizaBoard: React.FC<LazerHafizaBoardProps> = ({
  feedbackState,
  levelConfig,
  localPhase,
  onCellClick,
  path,
  userPath,
  visiblePathIndex,
}) => {
  const canvasSize = useResponsiveCanvasSize();
  const previewSvgPath =
    localPhase === "preview" && visiblePathIndex >= 1
      ? buildSvgPath(path.slice(0, visiblePathIndex + 1), levelConfig.gridSize)
      : "";
  const userSvgPath = buildSvgPath(userPath, levelConfig.gridSize);
  const gridTemplate = `repeat(${levelConfig.gridSize}, minmax(0, 1fr))`;
  const isWrongFeedback = feedbackState && !feedbackState.correct;

  const getNodeState = (row: number, col: number) => {
    const isPreviewActive =
      localPhase === "preview" &&
      path.some(
        (coordinate, index) =>
          index <= visiblePathIndex &&
          coordinate.row === row &&
          coordinate.col === col,
      );
    const isUserActive =
      (localPhase === "playing" || feedbackState) &&
      userPath.some(
        (coordinate) => coordinate.row === row && coordinate.col === col,
      );

    let isHead = false;

    if (localPhase === "preview") {
      const currentHead = path[visiblePathIndex];
      isHead = Boolean(
        currentHead && currentHead.row === row && currentHead.col === col,
      );
    } else {
      const lastUserMove = userPath[userPath.length - 1];
      isHead = Boolean(
        lastUserMove && lastUserMove.row === row && lastUserMove.col === col,
      );
    }

    return { active: isPreviewActive || isUserActive, isHead };
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-4 mb-8 w-full">
      <AnimatePresence mode="wait">
        {path.length > 0 ? (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center"
          >
            <LazerHafizaStatus
              feedbackState={feedbackState}
              localPhase={localPhase}
            />

            <div
              className="relative bg-[#FAF9F6] dark:bg-slate-800 rounded-3xl border-2 border-black/10 shadow-neo-sm dark:shadow-[8px_8px_0_#0f172a] p-4 sm:p-6"
              style={{ width: canvasSize, height: canvasSize }}
            >
              <svg
                className="absolute inset-4 sm:inset-6 pointer-events-none z-10"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter
                    id="laserGlow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {localPhase === "preview" && previewSvgPath ? (
                  <path
                    d={previewSvgPath}
                    stroke={GAME_COLORS.emerald}
                    strokeWidth="3"
                    fill="none"
                    filter="url(#laserGlow)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {(localPhase === "playing" || feedbackState) && userSvgPath ? (
                  <path
                    d={userSvgPath}
                    stroke={
                      isWrongFeedback ? GAME_COLORS.incorrect : GAME_COLORS.emerald
                    }
                    strokeWidth="3"
                    fill="none"
                    filter="url(#laserGlow)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
              </svg>

              <div
                className="grid w-full h-full relative z-20"
                style={{
                  gridTemplateColumns: gridTemplate,
                  gridTemplateRows: gridTemplate,
                }}
              >
                {Array.from({
                  length: levelConfig.gridSize * levelConfig.gridSize,
                }).map((_, index) => {
                  const row = Math.floor(index / levelConfig.gridSize);
                  const col = index % levelConfig.gridSize;
                  const { active, isHead } = getNodeState(row, col);
                  const dotSize =
                    levelConfig.gridSize <= 4 ? "w-5 h-5" : "w-4 h-4";

                  let nodeStyle: React.CSSProperties = {
                    background: "#cbd5e1",
                    border: "4px solid #000",
                    boxShadow: "4px 4px 0 #000",
                  };

                  if (active) {
                    nodeStyle = {
                      background: isWrongFeedback
                        ? GAME_COLORS.pink
                        : GAME_COLORS.emerald,
                      border: "4px solid #000",
                      boxShadow: "6px 6px 0 #000",
                    };
                  }

                  if (isHead) {
                    nodeStyle = {
                      ...nodeStyle,
                      background: isWrongFeedback ? GAME_COLORS.pink : "#fff",
                      boxShadow: "8px 8px 0 #000",
                      transform: "scale(1.3)",
                    };
                  }

                  return (
                    <div
                      key={`${row}-${col}`}
                      onClick={() => onCellClick(row, col)}
                      className="flex items-center justify-center cursor-pointer group min-w-[44px] min-h-[44px]"
                    >
                      <motion.div
                        className={`${dotSize} rounded-full transition-all duration-300`}
                        style={nodeStyle}
                        whileTap={localPhase === "playing" ? { scale: 0.9 } : {}}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {levelConfig.allowDiagonals ? (
              <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-bold tracking-wider">
                <Zap size={14} /> ÇAPRAZ GEÇİŞLER AKTİF
              </div>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex justify-center"
          >
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-black/10 shadow-neo-sm font-nunito font-black uppercase tracking-widest text-sm text-black dark:text-white">
              <Crosshair size={20} className="text-cyber-green" />
              Yol hazırlanıyor...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LazerHafizaBoard;
