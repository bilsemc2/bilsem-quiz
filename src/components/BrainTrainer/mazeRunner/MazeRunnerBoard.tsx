import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import {
  FEEDBACK_DURATION_MS,
} from "./constants";
import {
  calculateCanvasSize,
  getLogicalCellKey,
  isExitReached,
  isStartZone,
  shouldAppendPoint,
} from "./logic";
import { buildCollisionMask, drawMazeScene, hasCollision } from "./canvasRendering";
import type { MazeLevelData, PathPoint } from "./types";

interface MazeRunnerBoardProps {
  mazeLevel: MazeLevelData | null;
  lives: number;
  warning: string | null;
  shake: boolean;
  boardResetKey: number;
  feedbackActive: boolean;
  onCrash: () => void;
  onWrongPath: () => void;
  onComplete: () => void;
}

const MazeRunnerBoard: React.FC<MazeRunnerBoardProps> = ({
  mazeLevel,
  lives,
  warning,
  shake,
  boardResetKey,
  feedbackActive,
  onCrash,
  onWrongPath,
  onComplete,
}) => {
  const [canvasSize, setCanvasSize] = useState(0);
  const [path, setPath] = useState<PathPoint[]>([]);
  const [lastLogicalCell, setLastLogicalCell] = useState("0,0");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const collisionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const cellSize = useMemo(() => {
    if (!mazeLevel || canvasSize === 0) {
      return 0;
    }

    return canvasSize / Math.max(mazeLevel.cols, mazeLevel.rows);
  }, [canvasSize, mazeLevel]);

  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize(calculateCanvasSize(window.innerWidth, window.innerHeight));
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  useEffect(() => {
    isDrawingRef.current = false;
    setPath([]);
    setLastLogicalCell("0,0");
  }, [boardResetKey]);

  useEffect(() => {
    if (!mazeLevel || canvasSize === 0) {
      return;
    }

    if (!collisionCanvasRef.current) {
      collisionCanvasRef.current = document.createElement("canvas");
    }

    buildCollisionMask(collisionCanvasRef.current, mazeLevel, canvasSize);
  }, [canvasSize, mazeLevel]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !mazeLevel || canvasSize === 0) {
      return;
    }

    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    drawMazeScene(context, mazeLevel, canvasSize, path, lives);
  }, [canvasSize, lives, mazeLevel, path]);

  const handleInputStart = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !mazeLevel || cellSize === 0 || feedbackActive) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (!isStartZone(x, y, cellSize)) {
      return;
    }

    isDrawingRef.current = true;
    setPath([{ x, y }]);
    setLastLogicalCell("0,0");
  };

  const handleInputMove = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || !canvasRef.current || !mazeLevel || cellSize === 0 || feedbackActive) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (hasCollision(collisionCanvasRef.current, x, y)) {
      isDrawingRef.current = false;
      setPath([]);
      setLastLogicalCell("0,0");
      onCrash();
      return;
    }

    const logicalCellKey = getLogicalCellKey(x, y, cellSize);
    if (logicalCellKey !== lastLogicalCell) {
      setLastLogicalCell(logicalCellKey);
      if (!mazeLevel.solutionSet.has(logicalCellKey)) {
        onWrongPath();
      }
    }

    if (isExitReached(x, y, mazeLevel.cols, mazeLevel.rows, cellSize)) {
      isDrawingRef.current = false;
      onComplete();
      return;
    }

    setPath((current) => {
      if (!shouldAppendPoint(current, x, y)) {
        return current;
      }

      return [...current, { x, y }];
    });
  };

  const handleInputEnd = () => {
    isDrawingRef.current = false;
    setPath([]);
  };

  if (!mazeLevel) {
    return null;
  }

  return (
    <div
      className={`relative z-10 flex flex-col items-center justify-center w-full max-w-lg flex-1 mt-2 mx-auto ${shake ? "animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]" : ""}`}
      style={{ touchAction: "none", overscrollBehavior: "none" }}
    >
      <motion.div
        key={`maze-${boardResetKey}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: FEEDBACK_DURATION_MS / 3000 }}
        className={`flex flex-col items-center w-full relative ${feedbackActive ? "pointer-events-none" : ""}`}
      >
        {warning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 z-40 pointer-events-none"
          >
            <span className="text-xl sm:text-2xl font-nunito font-black text-white px-6 py-3 bg-cyber-pink border-2 border-black/10 rounded-2xl shadow-neo-sm uppercase tracking-widest whitespace-nowrap">
              {warning}
            </span>
          </motion.div>
        )}

        <div
          className="relative touch-none bg-white dark:bg-slate-800 p-2 rounded-2xl border-3 border-black/10 shadow-neo-sm dark:shadow-[4px_4px_0_#0f172a]"
          style={{ width: canvasSize + 16, height: canvasSize + 16 }}
        >
          <canvas
            ref={canvasRef}
            className="cursor-crosshair rounded-xl"
            style={{ background: "transparent" }}
            onClick={() => {}}
            onMouseDown={(event) => handleInputStart(event.clientX, event.clientY)}
            onMouseMove={(event) => handleInputMove(event.clientX, event.clientY)}
            onMouseUp={handleInputEnd}
            onMouseLeave={handleInputEnd}
            onTouchStart={(event) => {
              event.preventDefault();
              handleInputStart(event.touches[0].clientX, event.touches[0].clientY);
            }}
            onTouchMove={(event) => {
              event.preventDefault();
              handleInputMove(event.touches[0].clientX, event.touches[0].clientY);
            }}
            onTouchEnd={handleInputEnd}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default MazeRunnerBoard;
