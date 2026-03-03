const fs = require('fs');
const path = require('path');

const fileP = path.join(__dirname, 'src/components/BrainTrainer/ShapeAlgebraGame.tsx');
let content = fs.readFileSync(fileP, 'utf8');

// Imports
content = content.replace(
    /import \{ useSound \} from "\.\.\/\.\.\/hooks\/useSound";/g,
    `import { useSound } from "../../hooks/useSound";
import { useGameEngine } from "../../hooks/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";`
);

// Remove unused imports
content = content.replace(/import \{ Link, useLocation, useNavigate \} from "react-router-dom";\n/g, '');
content = content.replace(/import \{ useGamePersistence \} from "\.\.\/\.\.\/hooks\/useGamePersistence";\n/g, '');
content = content.replace(/import \{ useExam \} from "\.\.\/\.\.\/contexts\/ExamContext";\n/g, '');
content = content.replace(/import \{\s*Trophy,\s*RotateCcw,\s*Play,\s*Star,\s*Timer as TimerIcon,\s*ChevronLeft,\s*Zap,\s*Heart,\s*Equal,\s*Plus,\s*Delete,\s*Check,\s*Brain,\s*Sparkles,\s*\} from "lucide-react";/g, `import { Equal, Plus, Delete, Check, Brain } from "lucide-react";`);

// State replacement
content = content.replace(/const INITIAL_LIVES = 5;\n/g, '');
content = content.replace(/type Phase = "welcome" \| "playing" \| "feedback" \| "game_over" \| "victory";\n/g, '');

content = content.replace(
    /const ShapeAlgebraGame: React\.FC = \(\) => \{[\s\S]*?const timerRef = useRef<NodeJS\.Timeout \| null>\(null\);/g,
    `const ShapeAlgebraGame: React.FC = () => {
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
  });

  const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({
    duration: 1500,
  });

  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [userAnswer, setUserAnswer] = useState("");`
);

content = content.replace(/const startTimeRef = useRef[\s\S]*?\[phase, timeLeft\]\);\n/g, '');

content = content.replace(/const handleStart = useCallback[\s\S]*?\[location\.state, examMode, phase, handleStart\]\);\n/g, `
  useEffect(() => {
    if (engine.phase === "playing" && !levelData) {
      setLevelData(genLevel(1));
      setUserAnswer("");
    }
  }, [engine.phase, levelData]);
`);

content = content.replace(/const handleFinish = useCallback[\s\S]*?\[phase, handleFinish\]\);\n/g, '');

content = content.replace(/const correct = levelData\.question\.answer === parseInt\(userAnswer, 10\);/g, `const correct = levelData.question.answer === parseInt(userAnswer, 10);`);
content = content.replace(/setScore\(\(p\) => p \+ level \* 10\);/g, `engine.addScore(engine.level * 10); engine.onCorrect();`);
content = content.replace(/else \{\n\s*setLevel\(\(p\) => p \+ 1\);\n\s*setLevelData\(genLevel\(level \+ 1\)\);\n\s*setUserAnswer\(""\);\n\s*\}/g, `else {\n          engine.nextLevel();\n          setLevelData(genLevel(engine.level + 1));\n          setUserAnswer("");\n        }`);
content = content.replace(/if \(level >= MAX_LEVEL\) setPhase\("victory"\);/g, `if (engine.level >= MAX_LEVEL) engine.setGamePhase("victory");`);
content = content.replace(/setLives\(\(l\) => \{[\s\S]*?return nl;\n\s*\}\);/g, `engine.loseLife(); engine.onIncorrect();\n        if (engine.lives <= 1) engine.setGamePhase("game_over");\n        else setUserAnswer("");`);

content = content.replace(/const formatTime = [\s\S]*?"Geri";\n/g, '');

content = content.replace(/if \(phase === "welcome"\) \{[\s\S]*?export default ShapeAlgebraGame;/g, `
  return (
    <BrainTrainerShell
      engine={engine}
      config={{
        title: "Şekil Cebiri",
        icon: Brain,
        description: "Şekillerin gizli sayısal değerlerini bul, görsel denklemleri çöz ve matematik dehası olduğunu kanıtla!",
        howToPlay: [
          "Her satırdaki şekillerin toplam değerini incele.",
          "Her şeklin hangi sayıya karşılık geldiğini mantık yürüterek bul.",
          "En alttaki soruda istenen toplam değeri klavyeden yaz."
        ],
        tuzoCode: "5.5.2 Kural Çıkarsama",
        accentColor: "bg-cyber-blue",
        maxLevel: MAX_LEVEL,
      }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {engine.phase === "playing" && levelData && (
            <motion.div
              key={engine.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg space-y-6"
            >
              <div className="space-y-4">
                {levelData.equations.map((eq, i) => (
                  <motion.div
                    key={eq.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-center bg-white dark:bg-slate-800 p-5 rounded-[2rem] border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a]"
                  >
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {eq.items.map((item, idx) => {
                        const v = levelData.variables.find(
                          (x) => x.id === item.variableId,
                        );
                        return (
                          <React.Fragment key={idx}>
                            {idx > 0 && (
                              <Plus
                                className="text-black dark:text-white"
                                size={24}
                                strokeWidth={3}
                              />
                            )}
                            <ShapeIcon
                              shape={v!.shape}
                              color={v!.color}
                              dotted={v!.dotted}
                              size={42}
                            />
                          </React.Fragment>
                        );
                      })}
                      <Equal
                        className="text-black dark:text-white mx-2"
                        size={28}
                        strokeWidth={3}
                      />
                      <span className="text-4xl font-syne font-black text-black dark:text-white drop-shadow-sm">
                        {eq.result}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-cyber-yellow border-4 border-black rounded-[2rem] p-8 flex flex-col items-center gap-6 shadow-[12px_12px_0_#000] relative overflow-hidden rotate-1">
                <span className="text-black font-syne font-black uppercase tracking-widest text-sm bg-white border-2 border-black px-4 py-1.5 rounded-xl shadow-[4px_4px_0_#000] -rotate-2">
                  {levelData.question.text}
                </span>

                <div className="flex flex-wrap justify-center gap-4 items-center w-full">
                  <div className="flex flex-wrap justify-center gap-2">
                    {levelData.question.items.map((it, idx) => {
                      const v = levelData.variables.find(
                        (x) => x.id === it.variableId,
                      );
                      return (
                        <React.Fragment key={idx}>
                          {idx > 0 && (
                            <Plus
                              className="text-black"
                              size={28}
                              strokeWidth={4}
                            />
                          )}
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <ShapeIcon
                              shape={v!.shape}
                              color={v!.color}
                              dotted={v!.dotted}
                              size={56}
                            />
                          </motion.div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <Equal className="text-black" size={36} strokeWidth={4} />

                  <div
                    className={\`w-28 h-20 rounded-2xl border-4 flex items-center justify-center text-5xl font-syne font-black transition-all shadow-inner \${feedbackState ? (feedbackState.correct ? "bg-cyber-green border-black text-black shadow-[inset_0_4px_0_rgba(0,0,0,0.1)]" : "bg-cyber-pink border-black text-black shadow-[inset_0_4px_0_rgba(0,0,0,0.2)]") : "bg-white border-black text-black shadow-[inset_0_6px_0_rgba(0,0,0,0.1)]"}\`}
                  >
                    {userAnswer || (
                      <span className="text-black/20 animate-pulse">?</span>
                    )}
                  </div>
                </div>
                <GameFeedbackBanner feedback={feedbackState} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map(
                  (k) => (
                    <motion.button
                      key={k}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        userAnswer.length < 3 &&
                        !feedbackState &&
                        setUserAnswer((p) => p + k)
                      }
                      disabled={!!feedbackState}
                      className={\`py-5 rounded-2xl bg-white dark:bg-slate-800 border-4 border-black text-3xl font-syne font-black text-black dark:text-white shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#0f172a] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all \${k === "0" ? "col-start-2" : ""}\`}
                    >
                      {k}
                    </motion.button>
                  ),
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    !feedbackState && setUserAnswer((p) => p.slice(0, -1))
                  }
                  disabled={!!feedbackState}
                  className="py-5 rounded-2xl bg-cyber-pink border-4 border-black text-black flex items-center justify-center col-start-1 row-start-4 shadow-[6px_6px_0_#000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                >
                  <Delete size={32} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={!userAnswer || !!feedbackState}
                  className="py-5 rounded-2xl bg-cyber-green border-4 border-black text-black flex items-center justify-center col-start-3 row-start-4 shadow-[6px_6px_0_#000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:active:translate-x-0 disabled:active:shadow-[6px_6px_0_#000]"
                >
                  <Check size={32} strokeWidth={3} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrainTrainerShell>
  );
};
export default ShapeAlgebraGame;
`);

fs.writeFileSync(fileP, content);
console.log('ShapeAlgebraGame refactored');
