const fs = require('fs');
const path = require('path');

// 1. Fix SSG
const ssgP = path.join(__dirname, 'src/components/BrainTrainer/SentenceSynonymGame.tsx');
let ssg = fs.readFileSync(ssgP, 'utf8');
ssg = ssg.replace(/import React, \{ useState, useEffect, useCallback, useRef \} from "react";/g, 'import React, { useState, useEffect, useCallback } from "react";');
ssg = ssg.replace(/\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n  const fetchQuestions = useCallback/g, 'const fetchQuestions = useCallback');
ssg = ssg.replace(/\}, \[\]\);/g, '}, [engine]);');
fs.writeFileSync(ssgP, ssg);

// 2. Fix SAG (check if it actually compiles)
// We didn't get to lint ShapeAlgebraGame.tsx yet. I'll just rewrite SDG now.

// 3. Rewrite SDG
const sdgP = path.join(__dirname, 'src/components/BrainTrainer/SpotDifferenceGame.tsx');
let sdg = fs.readFileSync(sdgP, 'utf8');

sdg = sdg.replace(/import \{ useSound \} from "\.\.\/\.\.\/hooks\/useSound";/g, `import { useSound } from "../../hooks/useSound";
import { useGameEngine } from "../../hooks/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";`);

sdg = sdg.replace(/import \{\n\s*Trophy,\n\s*RotateCcw,\n\s*Play,\n\s*Star,\n\s*Timer as TimerIcon,\n\s*ChevronLeft,\n\s*Zap,\n\s*Heart,\n\s*Eye,\n\s*Sparkles,\n\} from "lucide-react";/g, 'import { Eye } from "lucide-react";');
sdg = sdg.replace(/import \{ Link, useLocation, useNavigate \} from "react-router-dom";\n/g, '');
sdg = sdg.replace(/import \{ useExam \} from "\.\.\/\.\.\/contexts\/ExamContext";\n/g, '');
sdg = sdg.replace(/import \{ useGamePersistence \} from "\.\.\/\.\.\/hooks\/useGamePersistence";\n/g, '');

sdg = sdg.replace(/const INITIAL_LIVES = 5;\n/g, '');
sdg = sdg.replace(/type Phase = "welcome" \| "playing" \| "feedback" \| "game_over" \| "victory";\n/g, '');

sdg = sdg.replace(/const SpotDifferenceGame: React\.FC = \(\) => \{[\s\S]*?const \[selectedIndex, setSelectedIndex\] = useState<number \| null>\(null\);/g, `const SpotDifferenceGame: React.FC = () => {
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
  });
  const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({
    duration: 1500,
  });

  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [roundTimeLeft, setRoundTimeLeft] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);`);

sdg = sdg.replace(/const timerRef = useRef[\s\S]*?\[phase, timeLeft\]\);\n/g, '');

sdg = sdg.replace(/useEffect\(\(\) => \{\n\s*if \(phase !== "playing"[\s\S]*?\[phase, roundData, selectedIndex\]\);/, `useEffect(() => {
    if (engine.phase !== "playing" || !roundData || selectedIndex !== null) return;
    const start = performance.now();
    let rId: number;
    const tick = (now: number) => {
      const el = (now - start) / 1000;
      const rem = Math.max(0, roundData.perRoundTime - el);
      setRoundTimeLeft(rem);
      if (rem <= 0) {
        handlePick(-1);
        return;
      }
      rId = requestAnimationFrame(tick);
    };
    rId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rId);
  }, [engine.phase, roundData, selectedIndex]);`);

sdg = sdg.replace(/const handlePick = useCallback\([\s\S]*?\[\n\s*roundData,\n\s*selectedIndex,\n\s*phase,\n\s*level,\n\s*roundTimeLeft,\n\s*startNewRound,\n\s*playSound,\n\s*showFeedback,\n\s*dismissFeedback,\n\s*\],\n\s*\);/g, `const handlePick = useCallback(
    (idx: number) => {
      if (!roundData || selectedIndex !== null || engine.phase !== "playing") return;
      const correct = idx === roundData.oddIndex;
      setSelectedIndex(idx);
      showFeedback(correct);
      playSound(correct ? "correct" : "incorrect");
      setTimeout(() => {
        dismissFeedback();
        if (correct) {
          engine.addScore(10 * engine.level + Math.round(roundTimeLeft * 5));
          engine.onCorrect();
          if (engine.level >= MAX_LEVEL) engine.setGamePhase("victory");
          else {
            engine.nextLevel();
            startNewRound(engine.level + 1);
          }
        } else {
          engine.loseLife();
          engine.onIncorrect();
          if (engine.lives <= 1) engine.setGamePhase("game_over");
          else startNewRound(engine.level);
        }
      }, 1500);
    },
    [roundData, selectedIndex, engine, roundTimeLeft, startNewRound, playSound, showFeedback, dismissFeedback],
  );`);

sdg = sdg.replace(/const handleStart = useCallback\(\(\) => \{[\s\S]*?\[location\.state, phase, handleStart, examMode\]\);\n/g, `
  useEffect(() => {
    if (engine.phase === "playing" && !roundData) {
      startNewRound(1);
    }
  }, [engine.phase, roundData, startNewRound]);
`);

sdg = sdg.replace(/const handleFinish = useCallback\([\s\S]*?\[phase, handleFinish\]\);\n/g, '');

sdg = sdg.replace(/isRevealed=\{(phase === "feedback" \|\| !!feedbackState)\}/g, 'isRevealed={!!feedbackState}'); // The Tile used isRevealed={phase === "feedback"}, let's check
sdg = sdg.replace(/isRevealed=\{phase === "feedback"\}/g, 'isRevealed={!!feedbackState}');

sdg = sdg.replace(/disabled=\{phase !== "playing"\}/g, 'disabled={engine.phase !== "playing" || !!feedbackState}');

sdg = sdg.replace(/const formatTime = [\s\S]*?const backLabel = [\s\S]*?"Geri";\n/g, '');

sdg = sdg.replace(/if \(phase === "welcome"\) \{[\s\S]*?export default SpotDifferenceGame;/g, `
  return (
    <BrainTrainerShell
      engine={engine}
      config={{
        title: "Farkı Bul",
        icon: Eye,
        description: "Bir kare diğerlerinden farklı! Renk, şekil, boyut ve açı ipuçlarını gözlemle, farklı olanı bul.",
        howToPlay: [
          "Ekrana gelen grid içindeki farklı kareyi bul.",
          "Her round için üstteki süre barı dolmadan tıkla.",
        ],
        tuzoCode: "5.7.1 Seçici Dikkat",
        accentColor: "bg-cyber-yellow",
        maxLevel: MAX_LEVEL,
      }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {engine.phase === "playing" && roundData && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg"
            >
              <div className="mb-6 h-4 bg-white dark:bg-slate-800 rounded-full overflow-hidden border-4 border-black p-0.5 shadow-[4px_4px_0_#000] -rotate-1">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: \`\${(roundTimeLeft / roundData.perRoundTime) * 100}%\`,
                    background:
                      roundTimeLeft < 3
                        ? "#ff2745" // cyber-pink
                        : "#2be1ff", // cyber-blue
                    transition: "background 0.3s",
                  }}
                />
              </div>
              <div className="mb-6 text-center">
                <span className="px-5 py-2 bg-cyber-yellow rounded-xl border-4 border-black text-sm font-syne font-black text-black tracking-wider uppercase shadow-[4px_4px_0_#000] rotate-2 inline-block">
                  Fark Tipi: {DIFF_LABELS[roundData.diffType]}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border-4 border-black shadow-[12px_12px_0_#000] rotate-1">
                <div
                  className="grid gap-3 sm:gap-4"
                  style={{
                    gridTemplateColumns: \`repeat(\${roundData.size}, minmax(0, 1fr))\`,
                  }}
                >
                  {tiles.map((tile) => (
                    <Tile
                      key={tile.index}
                      tile={tile}
                      isOdd={tile.index === roundData.oddIndex}
                      isSelected={tile.index === selectedIndex}
                      isRevealed={!!feedbackState}
                      onClick={() => handlePick(tile.index)}
                      disabled={engine.phase !== "playing" || !!feedbackState}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <GameFeedbackBanner feedback={feedbackState} />
      </div>
    </BrainTrainerShell>
  );
};
export default SpotDifferenceGame;
`);

fs.writeFileSync(sdgP, sdg);
console.log('Fixed SSG, and rewritten SDG');
