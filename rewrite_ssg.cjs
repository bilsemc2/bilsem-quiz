const fs = require('fs');
const path = require('path');

const fileP = path.join(__dirname, 'src/components/BrainTrainer/SentenceSynonymGame.tsx');
let content = fs.readFileSync(fileP, 'utf8');

// 1. Imports
content = content.replace(
    /import \{ useSound \} from "\.\.\/\.\.\/hooks\/useSound";/g,
    `import { useSound } from "../../hooks/useSound";
import { useGameEngine } from "../../hooks/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";`
);

// Remove unused imports (Trophy, RotateCcw, Link, etc from lucide/react-router if possible, but let's just let ESLint handle that later if any)

// 2. Component Setup
content = content.replace(
    /const SentenceSynonymGame: React\.FC = \(\) => \{[\s\S]*?const timerRef = useRef<NodeJS\.Timeout \| null>\(null\);/,
    `const SentenceSynonymGame: React.FC = () => {
  const { playSound } = useSound();
  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    timeLimit: TIME_LIMIT,
  });

  const [isFetching, setIsFetching] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [, setErrorMessage] = useState("");
  const [feedbackState, setFeedbackState] = useState<{ correct: boolean } | null>(null);`
);

// Remove timer and save logic since Engine handles time and saving.
content = content.replace(/const startTimeRef = useRef\(0\);\s*const hasSavedRef = useRef\(false\);\s*const examMode = location\.state\?\.examMode \|\| false;\s*const examTimeLimit = location\.state\?\.examTimeLimit \|\| TIME_LIMIT;/g, '');

content = content.replace(/const fetchQuestions = useCallback\(/g, `
  const fetchQuestions = useCallback(`);

content = content.replace(/setGameState\("loading"\);/g, `setIsFetching(true);`);
content = content.replace(/setGameState\("error"\);/g, `setIsFetching(false); engine.setGamePhase("game_over");`);
content = content.replace(/setGameState\("playing"\);/g, `setIsFetching(false);`);

content = content.replace(/const handleStart = useCallback\(\(\) => \{[\s\S]*?fetchQuestions\(\);\n\s*\}, \[fetchQuestions, playSound, examMode, examTimeLimit\]\);/g, `
  useEffect(() => {
    if (engine.phase === "playing" && questions.length === 0 && !isFetching) {
      setCorrectCount(0);
      setWrongCount(0);
      setStreak(0);
      setBestStreak(0);
      setFeedbackState(null);
      fetchQuestions();
    }
  }, [engine.phase, questions.length, isFetching, fetchQuestions]);
`);

// Remove old timer useEffect
content = content.replace(/useEffect\(\(\) => \{\s*if \(\(location\.state\?\.autoStart[\s\S]*?return \(\) => clearInterval\(timerRef\.current!\);\s*\}\s*\}, \[gameState, timeLeft, feedbackState, playSound\]\);/g, '');


// Answer Logic
content = content.replace(/const handleAnswer = \(id: string\) => \{[\s\S]*?\}, 1500\);\n  \};/, `
  const handleAnswer = (id: string) => {
    if (feedbackState || !questions[engine.level - 1]) return;

    setSelectedAnswer(id);
    const correct = id === questions[engine.level - 1].correct_option_id;

    playSound(correct ? "correct" : "wrong");
    setFeedbackState({ correct });

    if (correct) {
      setCorrectCount((p) => p + 1);
      setStreak((p) => {
        const ns = p + 1;
        if (ns > bestStreak) setBestStreak(ns);
        return ns;
      });
      engine.addScore(100 + streak * 10);
      engine.onCorrect();
    } else {
      setWrongCount((p) => p + 1);
      setStreak(0);
      engine.loseLife();
      engine.onIncorrect();
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      setFeedbackState(null);

      if (engine.lives <= 1 && !correct) {
        engine.setGamePhase("game_over");
      } else if (engine.level >= questions.length || engine.level >= MAX_LEVEL) {
        engine.setGamePhase("victory");
      } else {
        engine.nextLevel();
      }
    }, 1500);
  };
`);

// Remove handleFinish
content = content.replace(/const handleFinish = useCallback\([\s\S]*?useEffect\(\(\) => \{\s*if \(gameState === "finished" \|\| gameState === "victory"\) handleFinish\(\);\s*\}, \[gameState, handleFinish\]\);/g, '');

// Rendering
content = content.replace(/if \(gameState === "idle"\) \{[\s\S]*?export default SentenceSynonymGame;/g, `
  if (isFetching) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FAF9F6] dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border-4 border-black shadow-[8px_8px_0_#000] flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-black dark:text-white animate-spin" />
          <span className="font-syne font-black uppercase tracking-widest text-black dark:text-white">
            Sorular Hazırlanıyor...
          </span>
        </div>
      </div>
    );
  }

  return (
    <BrainTrainerShell
      engine={engine}
      config={{
        title: "Cümle İçi Eş Anlam",
        icon: MessageSquare,
        description: "Cümledeki kelimenin eş anlamlısını bul, bağlamsal zekanı kanıtla.",
        howToPlay: [
          "Cümlede vurgulanan kelimenin eş anlamlısını bul.",
          "Aşağıdaki seçeneklerden en uygun olanı işaretle.",
        ],
        tuzoCode: "6.1.2 Sözcük Bilgisi (Bağlam)",
        accentColor: "bg-cyber-purple",
        maxLevel: MAX_LEVEL,
      }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {engine.phase === "playing" && questions[engine.level - 1] && (
            <motion.div
              key={engine.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-2xl space-y-6 sm:space-y-8"
            >
              <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-6 sm:p-10 border-4 border-black shadow-[16px_16px_0_#000] dark:shadow-[16px_16px_0_#0f172a] text-center -rotate-1 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-purple text-white px-6 py-2 rounded-full font-syne font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_#000] flex items-center gap-2">
                  <Eye size={18} className="stroke-[3]" /> Bağlamı Çöz
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-syne font-black text-black dark:text-white leading-relaxed mt-6 mb-8 drop-shadow-sm">
                  "{formatSentence(questions[engine.level - 1].cumle)}"
                </h2>

                <div className="inline-flex px-6 py-2 bg-cyber-pink border-4 border-black rounded-xl text-black font-syne font-black uppercase tracking-wider shadow-[4px_4px_0_#000] rotate-1">
                  Doğru kelimeyi seç
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions[engine.level - 1].options.map((opt, i) => {
                  let buttonClass =
                    "bg-white dark:bg-slate-800 border-4 border-black shadow-[6px_6px_0_#000] hover:bg-slate-50";
                  let letterClass =
                    "bg-cyber-yellow border-2 border-black text-black";

                  if (selectedAnswer === opt.id) {
                    if (opt.id === questions[engine.level - 1].correct_option_id) {
                      buttonClass =
                        "bg-cyber-green border-4 border-black shadow-[2px_2px_0_#000] translate-y-1 translate-x-1";
                      letterClass = "bg-white border-2 border-black text-black";
                    } else {
                      buttonClass =
                        "bg-cyber-pink border-4 border-black shadow-[2px_2px_0_#000] translate-y-1 translate-x-1";
                      letterClass = "bg-white border-2 border-black text-black";
                    }
                  } else if (
                    selectedAnswer &&
                    opt.id === questions[engine.level - 1].correct_option_id
                  ) {
                    buttonClass =
                      "bg-cyber-green border-4 border-black animate-pulse opacity-90";
                    letterClass = "bg-white border-2 border-black text-black";
                  } else if (selectedAnswer) {
                    buttonClass =
                      "bg-slate-200 dark:bg-slate-700 border-4 border-black opacity-50";
                    letterClass =
                      "bg-slate-300 dark:bg-slate-600 border-2 border-black text-black";
                  }

                  return (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleAnswer(opt.id)}
                      disabled={!!selectedAnswer}
                      whileHover={
                        !selectedAnswer ? { scale: 1.02, y: -2, x: -2 } : {}
                      }
                      whileTap={
                        !selectedAnswer
                          ? { scale: 0.98, y: 2, x: 2, shadow: "none" }
                          : {}
                      }
                      className={\`py-5 px-6 rounded-[2rem] font-chivo font-black text-xl transition-all flex items-center justify-between group \${buttonClass} text-black dark:text-white\`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={\`w-12 h-12 rounded-xl flex items-center justify-center text-lg uppercase font-syne \${letterClass} transition-colors shadow-[2px_2px_0_#000]\`}
                        >
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center">
                        {selectedAnswer === opt.id &&
                          (opt.id === questions[engine.level - 1].correct_option_id ? (
                            <CheckCircle2
                              size={32}
                              className="text-black"
                              strokeWidth={3}
                            />
                          ) : (
                            <XCircle
                              size={32}
                              className="text-black"
                              strokeWidth={3}
                            />
                          ))}
                        {selectedAnswer &&
                          selectedAnswer !== opt.id &&
                          opt.id === questions[engine.level - 1].correct_option_id && (
                            <CheckCircle2
                              size={32}
                              className="text-black opacity-50"
                              strokeWidth={3}
                            />
                          )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {feedbackState && (
            <motion.div
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
            >
              <h2
                className={\`text-6xl md:text-8xl font-black font-syne uppercase tracking-tight px-8 py-6 rounded-[2rem] border-4 border-black shadow-[16px_16px_0_#000] \${feedbackState.correct ? "bg-cyber-green text-black rotate-2" : "bg-cyber-pink text-black -rotate-2"}\`}
              >
                {feedbackState.correct ? "DOĞRU! ✨" : "HATA!"}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrainTrainerShell>
  );
};

export default SentenceSynonymGame;
`);

fs.writeFileSync(fileP, content);
console.log('SentenceSynonymGame refactored');
