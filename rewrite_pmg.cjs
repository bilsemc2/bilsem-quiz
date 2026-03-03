const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/BrainTrainer/PuzzleMasterGame.tsx');

const content = `import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Target } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { useGameEngine } from "./shared/useGameEngine";
import { useGameFeedback } from "../../hooks/useGameFeedback";

const INITIAL_LIVES = 3; // Fewer lives for this one as it's harder
const TIME_LIMIT = 300; // Extra time for scanning
const MAX_LEVEL = 15;
const SELECTION_SIZE = 80;
const GAME_ID = "puzzle-master";

interface GameLevel {
  imageUrl: string;
  targetBox: { x: number; y: number; width: number; height: number };
  targetThumbnail: string;
}

class PuzzleGenerator {
  static generate(seed: string): string {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const s = seed.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const rand = (i: number) => {
      const x = Math.sin(s + i) * 10000;
      return x - Math.floor(x);
    };

    const grad = ctx.createLinearGradient(0, 0, size, size);
    const baseHue = Math.floor(rand(1) * 360);
    grad.addColorStop(0, \`hsl(\${baseHue}, 80%, 75%)\`);
    grad.addColorStop(1, \`hsl(\${(baseHue + 120) % 360}, 80%, 75%)\`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 2;
    for (let i = 0; i < size; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    for (let i = 0; i < 200; i++) {
      const x = rand(i * 2.5) * size;
      const y = rand(i * 3.7) * size;
      const sz = 20 + rand(i * 4.2) * 80;

      const hues = [330, 200, 150, 50, 280];
      const h = hues[Math.floor(rand(i * 5.1) * hues.length)];

      const t = Math.floor(rand(i * 7.8) * 6);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rand(i * 8.9) * Math.PI * 2);

      ctx.fillStyle = \`hsl(\${h}, 90%, 65%)\`;
      ctx.strokeStyle = "#000000"; 
      ctx.lineWidth = 3;

      ctx.beginPath();
      if (t === 0) {
        ctx.rect(-sz / 2, -sz / 2, sz, sz);
      } else if (t === 1) {
        ctx.arc(0, 0, sz / 2, 0, Math.PI * 2);
      } else if (t === 2) {
        ctx.moveTo(0, -sz / 2);
        ctx.lineTo(sz / 2, sz / 2);
        ctx.lineTo(-sz / 2, sz / 2);
      } else if (t === 3) {
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(
            (Math.cos((j * 72 * Math.PI) / 180) * sz) / 2,
            (Math.sin((j * 72 * Math.PI) / 180) * sz) / 2,
          );
          ctx.lineTo(
            (Math.cos(((j * 72 + 36) * Math.PI) / 180) * sz) / 4,
            (Math.sin(((j * 72 + 36) * Math.PI) / 180) * sz) / 4,
          );
        }
        ctx.closePath();
      } else if (t === 4) {
        ctx.moveTo(-sz / 2, 0);
        ctx.lineTo(sz / 2, 0);
        ctx.moveTo(0, -sz / 2);
        ctx.lineTo(0, sz / 2);
      } else {
        ctx.arc(0, 0, sz / 2, 0, Math.PI, true);
        ctx.lineTo(0, 0);
      }

      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fill();

      ctx.restore();
    }
    return canvas.toDataURL("image/png");
  }
}

const PuzzleMasterGame: React.FC = () => {
  const { playSound } = useSound();
  const [selection, setSelection] = useState({ x: 206, y: 206 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const engine = useGameEngine({
    gameId: GAME_ID,
    timeLimit: TIME_LIMIT,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
  });

  const feedback = useGameFeedback({ duration: 1500 });
  const [levelData, setLevelData] = useState<GameLevel | null>(null);

  const loadLevel = async (lvl: number) => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const seed = \`puzzle-\${lvl}-\${Date.now()}\`;
        const imageUrl = PuzzleGenerator.generate(seed);
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, 512, 512);

          const tx = 20 + Math.floor(Math.random() * (472 - SELECTION_SIZE));
          const ty = 20 + Math.floor(Math.random() * (472 - SELECTION_SIZE));

          const thumbCanvas = document.createElement("canvas");
          thumbCanvas.width = SELECTION_SIZE;
          thumbCanvas.height = SELECTION_SIZE;
          const thumbCtx = thumbCanvas.getContext("2d");
          if (thumbCtx) {
            thumbCtx.drawImage(
              canvas,
              tx, ty, SELECTION_SIZE, SELECTION_SIZE,
              0, 0, SELECTION_SIZE, SELECTION_SIZE,
            );
          }

          setSelection({ x: 206, y: 206 });
          setIsLoading(false);
          const data = {
            imageUrl,
            targetBox: {
              x: tx,
              y: ty,
              width: SELECTION_SIZE,
              height: SELECTION_SIZE,
            },
            targetThumbnail: thumbCanvas.toDataURL("image/png"),
          };
          setLevelData(data);
          resolve(data);
        };
      }, 50);
    });
  };

  useEffect(() => {
    if (engine.phase === "playing" && !levelData && !isLoading) {
      loadLevel(engine.level);
    } else if (engine.phase !== "playing") {
      setLevelData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.phase, engine.level]);

  const updateSelection = (e: React.MouseEvent | React.TouchEvent) => {
    if (feedback.feedbackState || isLoading) return;
    const board = document.getElementById("puzzle-board");
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const scale = 512 / rect.width;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    let x = (clientX - rect.left) * scale - SELECTION_SIZE / 2;
    let y = (clientY - rect.top) * scale - SELECTION_SIZE / 2;

    x = Math.max(0, Math.min(x, 512 - SELECTION_SIZE));
    y = Math.max(0, Math.min(y, 512 - SELECTION_SIZE));

    setSelection({ x, y });
  };

  const handleCheck = () => {
    if (!levelData || engine.phase !== "playing" || feedback.feedbackState || isLoading) return;
    const dx = Math.abs(selection.x - levelData.targetBox.x);
    const dy = Math.abs(selection.y - levelData.targetBox.y);
    const correct = dx < 25 && dy < 25; // generous margin
    
    feedback.showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    setTimeout(() => {
      feedback.dismissFeedback();
      if (correct) {
        engine.addScore(50 * engine.level);
        if (engine.level >= MAX_LEVEL) {
          engine.handleFinish(true);
          playSound("success");
        } else {
          loadLevel(engine.level + 1);
        }
      } else {
        engine.removeLife();
        if (engine.lives <= 1) {
          playSound("wrong");
        }
      }
    }, 1500);
  };

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: "Puzzle Master",
        description: "Karmaşık desenler içindeki küçük parçaları bul ve yerini tespit et. Görsel analiz yeteneğini konuştur!",
        tuzoLabel: "TUZÖ 5.3.2 Görsel Analiz",
        accentColor: "cyber-purple",
        icon: Search,
        howToPlay: [
          <span key="1"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-pink text-black border-2 border-black rounded-lg items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] rotate-2 mr-2">1</span> Sol taraftaki <strong>hedef parçayı</strong> dikkatlice incele</span>,
          <span key="2"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-yellow text-black border-2 border-black rounded-lg items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] -rotate-3 mr-2">2</span> Büyük tabloda <strong>bu parçanın yerini</strong> bul</span>,
          <span key="3"><span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-blue text-black border-2 border-black rounded-lg items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] rotate-1 mr-2">3</span> Seçim kutusunu <strong>sürükle</strong> ve kontrol et</span>
        ]
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-160px)] flex-1 w-full">
          <AnimatePresence mode="wait">
            {phase === "playing" && (
              <motion.div
                key="game"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start p-4"
              >
                <div className="lg:col-span-1 flex flex-col gap-4 lg:sticky top-6">
                  <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border-4 border-black shadow-[12px_12px_0_#000] dark:shadow-[12px_12px_0_#0f172a] text-center rotate-2">
                    <p className="text-[10px] sm:text-xs font-syne font-black text-black bg-cyber-yellow px-3 py-1.5 rounded-lg border-2 border-black inline-block mb-4 tracking-widest uppercase shadow-[2px_2px_0_#000]">
                      Bu Parçayı Bul
                    </p>

                    <div className="aspect-square w-full sm:w-48 mx-auto xl:w-full rounded-2xl overflow-hidden border-4 border-black bg-slate-900 relative shadow-inner">
                      {levelData?.targetThumbnail ? (
                        <img
                          src={levelData.targetThumbnail}
                          alt="Target block to find"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full animate-pulse bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <Search size={32} className="text-black/20" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 flex flex-col items-center gap-6 w-full">
                  <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-4 sm:p-6 border-4 border-black shadow-[16px_16px_0_#000] dark:shadow-[16px_16px_0_#0f172a] w-full -rotate-1 relative flex justify-center">
                    <div className="absolute top-6 left-12 w-12 h-4 bg-black/10 rounded-full" />
                    <div className="absolute top-6 right-12 w-4 h-4 bg-black/10 rounded-full" />

                    <div
                      id="puzzle-board"
                      className={\`relative w-full aspect-square max-w-[512px] rounded-2xl overflow-hidden border-4 border-black cursor-crosshair touch-none \${isLoading ? "opacity-50" : "opacity-100"} transition-opacity\`}
                      onMouseDown={(e) => {
                        if (isLoading || !!feedbackState) return;
                        setIsDragging(true);
                        updateSelection(e);
                      }}
                      onMouseMove={(e) => isDragging && updateSelection(e)}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseLeave={() => setIsDragging(false)}
                      onTouchStart={(e) => {
                        if (isLoading || !!feedbackState) return;
                        setIsDragging(true);
                        updateSelection(e);
                      }}
                      onTouchMove={(e) => isDragging && updateSelection(e)}
                      onTouchEnd={() => setIsDragging(false)}
                      style={{
                        backgroundImage:
                          "url(\\"data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0v20H0V0h20zm-1 1H1v18h18V1z' fill='%23000' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E\\")",
                        backgroundColor: "#e2e8f0",
                      }}
                    >
                      {isLoading && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                          <div className="w-16 h-16 border-8 border-cyber-pink border-t-black rounded-full animate-spin" />
                          <span className="mt-4 font-syne font-black uppercase text-black dark:text-white drop-shadow-md bg-white/80 dark:bg-black/50 px-4 py-1 rounded-full">
                            Oluşturuluyor...
                          </span>
                        </div>
                      )}

                      {levelData?.imageUrl && (
                        <img
                          src={levelData.imageUrl}
                          className="w-full h-full object-cover select-none pointer-events-none"
                          draggable={false}
                          alt="Chaotic pattern board"
                        />
                      )}

                      <div
                        className={\`absolute pointer-events-none transition-all duration-100 border-[6px] rounded-2xl shadow-[0_0_0_2px_rgba(0,0,0,0.8)_inset,0_0_20px_rgba(0,0,0,0.5)] \${feedbackState?.correct ? "border-cyber-green bg-cyber-green/20" : feedbackState?.correct === false ? "border-cyber-pink bg-cyber-pink/20" : isDragging ? "border-white bg-white/10" : "border-white/80"}\`}
                        style={{
                          left: \`\${(selection.x / 512) * 100}%\`,
                          top: \`\${(selection.y / 512) * 100}%\`,
                          width: \`\${(SELECTION_SIZE / 512) * 100}%\`,
                          height: \`\${(SELECTION_SIZE / 512) * 100}%\`,
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-50">
                          <div className="w-full h-1 bg-black/80" />
                          <div className="h-full w-1 bg-black/80 absolute" />
                          <div className="w-full h-0.5 bg-white absolute" />
                          <div className="h-full w-0.5 bg-white absolute" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCheck}
                    disabled={isLoading || !!feedbackState || !levelData}
                    className="w-full sm:w-auto px-16 py-5 bg-cyber-green text-black font-syne font-black text-2xl uppercase tracking-widest border-4 border-black rounded-[2rem] shadow-[8px_8px_0_#000] hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
                  >
                    <Target size={32} className="stroke-[3]" />
                    <span>Burada!</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default PuzzleMasterGame;
`;
fs.writeFileSync(filePath, content);
console.log('PuzzleMasterGame rewritten');
