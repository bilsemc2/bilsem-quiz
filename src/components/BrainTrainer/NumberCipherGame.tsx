import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { useSound } from "../../hooks/useSound";
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from "../../hooks/useGameFeedback";
import { useGameEngine } from "./shared/useGameEngine";
import BrainTrainerShell from "./shared/BrainTrainerShell";

const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const GAME_ID = "sayisal-sifre";

type QuestionType =
  | "hidden_operator"
  | "pair_relation"
  | "conditional"
  | "multi_rule";

interface Question {
  type: QuestionType;
  display: string[];
  question: string;
  answer: number;
  options: number[];
  explanation: string;
}

type Operator = "+" | "-" | "×";
const NumberCipherGame: React.FC = () => {
  // Çıkarmada a >= b olmasını garanti eder (negatif sayı üretmez)
  const safePair = (isSub: boolean): [number, number] => {
    let a = Math.floor(Math.random() * 9) + 1;
    let b = Math.floor(Math.random() * 9) + 1;
    if (isSub && a < b) [a, b] = [b, a];
    return [a, b];
  };

  const generateHiddenOperator = useCallback((): Question => {
    const ops: { op: Operator; fn: (a: number, b: number) => number }[] = [
      { op: "+", fn: (a, b) => a + b },
      { op: "-", fn: (a, b) => a - b },
      { op: "×", fn: (a, b) => a * b },
    ];
    const selected = ops[Math.floor(Math.random() * ops.length)];
    const isSub = selected.op === "-";

    const [a, b] = safePair(isSub);
    const res1 = selected.fn(a, b);

    const [c, d] = safePair(isSub);
    const res2 = selected.fn(c, d);

    const [e, f] = safePair(isSub);
    const answer = selected.fn(e, f);

    const options = [answer];
    let safety = 0;
    while (options.length < 4 && safety++ < 100) {
      const fake = Math.max(0, answer + Math.floor(Math.random() * 11) - 5);
      if (fake !== answer && !options.includes(fake)) options.push(fake);
    }
    while (options.length < 4) options.push(answer + options.length * 2);

    return {
      type: "hidden_operator",
      display: [`${a} ? ${b} = ${res1}`, `${c} ? ${d} = ${res2}`],
      question: `${e} ? ${f} = ?`,
      answer,
      options: options.sort(() => Math.random() - 0.5),
      explanation: `Kural: ${selected.op}`,
    };
  }, []);

  const generatePairRelation = useCallback((): Question => {
    const rules = [
      { name: "Kural: Toplam", fn: (a: number, b: number) => a + b },
      { name: "Kural: Fark", fn: (a: number, b: number) => Math.abs(a - b) },
      { name: "Kural: Çarpım", fn: (a: number, b: number) => a * b },
    ];
    const selected = rules[Math.floor(Math.random() * rules.length)];

    const pairs = Array.from({ length: 2 }, () => {
      const a = Math.floor(Math.random() * 6) + 2;
      const b = Math.floor(Math.random() * 6) + 1;
      return { a, b, res: selected.fn(a, b) };
    });

    const qa = Math.floor(Math.random() * 7) + 2;
    const qb = Math.floor(Math.random() * 7) + 1;
    const answer = selected.fn(qa, qb);

    const options = [answer];
    let safety = 0;
    while (options.length < 4 && safety++ < 100) {
      const fake = Math.max(0, answer + Math.floor(Math.random() * 11) - 5);
      if (fake !== answer && !options.includes(fake)) options.push(fake);
    }
    while (options.length < 4) options.push(answer + options.length * 2);

    return {
      type: "pair_relation",
      display: pairs.map((p) => `(${p.a}, ${p.b}) → ${p.res}`),
      question: `(${qa}, ${qb}) → ?`,
      answer,
      options: options.sort(() => Math.random() - 0.5),
      explanation: selected.name,
    };
  }, []);

  const generateConditional = useCallback((): Question => {
    const rules = [
      {
        name: "Tek→×2, Çift→/2",
        fn: (n: number) => (n % 2 !== 0 ? n * 2 : Math.floor(n / 2)),
      },
      {
        name: "Tek→+3, Çift→-2",
        fn: (n: number) => (n % 2 !== 0 ? n + 3 : n - 2),
      },
      {
        name: "<5→×3, ≥5→+5",
        fn: (n: number) => (n < 5 ? n * 3 : n + 5),
      },
    ];
    const selected = rules[Math.floor(Math.random() * rules.length)];

    const examples = [2, 3, 5, 8]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((n) => ({ input: n, output: selected.fn(n) }));

    const qNum = [1, 4, 6, 7, 9].sort(() => Math.random() - 0.5)[0];
    const answer = selected.fn(qNum);

    const options = [answer];
    let safety = 0;
    while (options.length < 4 && safety++ < 100) {
      const fake = Math.max(0, answer + Math.floor(Math.random() * 7) - 3);
      if (fake !== answer && !options.includes(fake)) options.push(fake);
    }
    while (options.length < 4) options.push(answer + options.length * 2);

    return {
      type: "conditional",
      display: examples.map((e) => `${e.input} → ${e.output}`),
      question: `${qNum} → ?`,
      answer,
      options: options.sort(() => Math.random() - 0.5),
      explanation: `Kural: ${selected.name}`,
    };
  }, []);

  const generateMultiRule = useCallback((): Question => {
    const rules = [
      { name: "A² + B", fn: (a: number, b: number) => a * a + b },
      { name: "A × B + A", fn: (a: number, b: number) => a * b + a },
      { name: "(A + B) × 2", fn: (a: number, b: number) => (a + b) * 2 },
    ];
    const selected = rules[Math.floor(Math.random() * rules.length)];

    const examples = Array.from({ length: 2 }, () => {
      const a = Math.floor(Math.random() * 4) + 2;
      const b = Math.floor(Math.random() * 4) + 1;
      return { a, b, res: selected.fn(a, b) };
    });

    const qa = Math.floor(Math.random() * 5) + 2;
    const qb = Math.floor(Math.random() * 5) + 1;
    const answer = selected.fn(qa, qb);

    const options = [answer];
    let safety = 0;
    while (options.length < 4 && safety++ < 100) {
      const fake = Math.max(0, answer + Math.floor(Math.random() * 11) - 5);
      if (fake !== answer && !options.includes(fake)) options.push(fake);
    }
    while (options.length < 4) options.push(answer + options.length * 2);

    return {
      type: "multi_rule",
      display: examples.map((e) => `A=${e.a}, B=${e.b} → ${e.res}`),
      question: `A=${qa}, B=${qb} → ?`,
      answer,
      options: options.sort(() => Math.random() - 0.5),
      explanation: `Kural: ${selected.name}`,
    };
  }, []);


  const engine = useGameEngine({
    gameId: GAME_ID,
    maxLevel: MAX_LEVEL,
    initialLives: INITIAL_LIVES,
    timeLimit: TIME_LIMIT,
  });

  const { playSound } = useSound();
  const safeTimeout = useSafeTimeout();
  const feedback = useGameFeedback({ duration: 1500 });
  const { feedbackState, showFeedback, dismissFeedback } = feedback;
  const { phase, level, addScore, loseLife, nextLevel } = engine;

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const startLevel = useCallback(
    (lvl: number) => {
      let q: Question;
      if (lvl <= 5) q = generateHiddenOperator();
      else if (lvl <= 10) q = generatePairRelation();
      else if (lvl <= 15) q = generateConditional();
      else q = generateMultiRule();

      setCurrentQuestion(q);
      setSelectedAnswer(null);
    },
    [generateHiddenOperator, generatePairRelation, generateConditional, generateMultiRule],
  );

  useEffect(() => {
    if (phase === "playing" && !currentQuestion) {
      startLevel(level);
    } else if (phase === "welcome") {
      setCurrentQuestion(null);
      setSelectedAnswer(null);
    }
  }, [phase, level, startLevel, currentQuestion]);

  const handleAnswer = useCallback((val: number) => {
    if (phase !== "playing" || selectedAnswer !== null || !currentQuestion || !!feedbackState)
      return;

    setSelectedAnswer(val);
    const correct = val === currentQuestion.answer;
    showFeedback(correct);
    playSound(correct ? "correct" : "wrong");

    safeTimeout(() => {
      dismissFeedback();
      if (correct) {
        addScore(10 * engine.level);
        if (engine.level >= MAX_LEVEL) {
          engine.setGamePhase("victory");
          playSound("success");
        } else {
          nextLevel();
          startLevel(engine.level + 1);
        }
      } else {
        loseLife();
        if (engine.lives > 1) {
          startLevel(engine.level);
        }
      }
    }, 1500);
  }, [phase, selectedAnswer, currentQuestion, feedbackState, showFeedback, playSound, safeTimeout, dismissFeedback, addScore, nextLevel, loseLife, engine, startLevel]);

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "hidden_operator":
        return "Gizli Operatör";
      case "pair_relation":
        return "Çift İlişkisi";
      case "conditional":
        return "Koşullu Şifre";
      case "multi_rule":
        return "Çoklu Kural";
      default:
        return "Gizemli Şifre";
    }
  };

  const gameConfig = {
    title: "Sayısal Şifre",
    description: "Sayıların arasındaki gizli kuralları keşfet ve şifreleri çöz. Matematiksel mantık yeteneğini geliştir!",
    tuzoCode: "TUZÖ 5.2.3 Soyut Sayısal Mantık",
    icon: Calculator,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      <>Verilen sayı <strong>örneklerini dikkatle incele</strong></>,
      <>Sayılar arasındaki <strong>gizli kuralı bul</strong></>,
      <>Soru işareti yerine gelecek <strong>doğru sayıyı seç</strong></>,
    ],
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => currentQuestion ? (
        <div className="w-full max-w-2xl flex flex-col items-center gap-4">
          <div className="w-full bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[2rem] border-2 border-black/10 shadow-neo-sm">
            <div className="text-center mb-4">
              <span className="bg-cyber-purple text-white px-5 py-1.5 rounded-full text-xs font-nunito font-black border-2 border-black/10 uppercase tracking-widest inline-block shadow-neo-sm rotate-1">
                {getQuestionTypeLabel(currentQuestion.type)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {currentQuestion.display.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-2xl text-center font-mono font-bold text-xl sm:text-2xl border-2 border-black/10 shadow-neo-sm text-black dark:text-white"
                >
                  {line}
                </motion.div>
              ))}
            </div>

            <div className="bg-cyber-yellow border-2 border-black/10 p-4 sm:p-5 rounded-[1.5rem] text-center mb-4 shadow-neo-sm rotate-1">
              <p className="text-black/70 text-xs mb-1 font-nunito font-black uppercase tracking-widest">
                Sıra Sende
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-black font-mono tracking-tighter">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                const isCorrect = isSelected && opt === currentQuestion.answer;
                const isWrong = isSelected && opt !== currentQuestion.answer;

                let btnClass = "bg-white dark:bg-slate-700 text-black dark:text-white";
                if (isCorrect) btnClass = "bg-cyber-green text-black";
                if (isWrong) btnClass = "bg-cyber-pink text-black";
                else if (selectedAnswer && opt === currentQuestion.answer)
                  btnClass = "bg-cyber-green text-black";

                return (
                  <motion.button
                    key={i}
                    whileTap={!selectedAnswer && !feedbackState ? { scale: 0.95 } : {}}
                    onClick={() => handleAnswer(opt)}
                    disabled={selectedAnswer !== null || !!feedbackState}
                    className={`py-5 sm:py-6 rounded-[1.5rem] border-2 border-black/10 text-3xl sm:text-4xl font-black font-mono transition-colors shadow-neo-sm hover:shadow-neo-sm ${btnClass}`}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      ) : <></>}
    </BrainTrainerShell>
  );
};

export default NumberCipherGame;
