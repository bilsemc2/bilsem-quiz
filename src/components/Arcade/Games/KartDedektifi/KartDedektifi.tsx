import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CardData, RuleType, Color, Shape, GameState, GamePhase } from './types';
import { REFERENCE_CARDS, CONSECUTIVE_LIMIT } from './constants';
import Card from './components/Card';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE } from '../../Shared/ArcadeConstants';

const KartDedektifi: React.FC = () => {
  const { saveGamePlay } = useGamePersistence();
  const location = useLocation();
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [gameState, setGameState] = useState<GameState>({
    currentRule: RuleType.Color,
    score: 0,
    totalAttempts: 0,
    consecutiveCorrect: 0,
    isGameOver: false,
    history: [],
  });

  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const gameStartTimeRef = useRef<number>(0);
  const hasSavedRef = useRef<boolean>(false);
  const isResolvingRef = useRef<boolean>(false);
  const consecutiveWrongRef = useRef<number>(0);

  // Auto-start from Hub
  useEffect(() => {
    if (location.state?.autoStart && phase === 'idle') {
      startGame();
    }
  }, [location.state, phase]);

  const startGame = () => {
    window.scrollTo(0, 0);
    setGameState({
      currentRule: RuleType.Color,
      score: 0,
      totalAttempts: 0,
      consecutiveCorrect: 0,
      isGameOver: false,
      history: [],
    });
    setLives(3);
    setLevel(1);
    setPhase('playing');
    setFeedback(null);
    gameStartTimeRef.current = Date.now();
    hasSavedRef.current = false;
    isResolvingRef.current = false;
    setCurrentCard(generateRandomCard());
  };

  // Game Over handler
  useEffect(() => {
    if (lives <= 0 && phase === 'playing') {
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        isResolvingRef.current = true;
        setPhase('game_over');
        saveGamePlay({
          game_id: 'kart-dedektifi',
          score_achieved: gameState.score,
          duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
          metadata: { level_reached: level }
        });
      }
    }
  }, [lives, phase, gameState.score, level, saveGamePlay]);

  const generateRandomCard = useCallback(() => {
    const colors = Object.values(Color);
    const shapes = Object.values(Shape);
    const id = Math.random().toString(36).substring(7);

    return {
      id,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      number: Math.floor(Math.random() * 4) + 1,
    };
  }, []);

  useEffect(() => {
    if (!currentCard && !gameState.isGameOver) {
      setCurrentCard(generateRandomCard());
    }
  }, [currentCard, gameState.isGameOver, generateRandomCard]);

  const checkMatch = (refCard: CardData) => {
    if (!currentCard || gameState.isGameOver || isResolvingRef.current) return;

    isResolvingRef.current = true;
    let isCorrect = false;
    const { currentRule } = gameState;

    if (currentRule === RuleType.Color) {
      isCorrect = currentCard.color === refCard.color;
    } else if (currentRule === RuleType.Shape) {
      isCorrect = currentCard.shape === refCard.shape;
    } else if (currentRule === RuleType.Number) {
      isCorrect = currentCard.number === refCard.number;
    }

    if (isCorrect) {
      setFeedback({ message: 'Dedektif iş başında! 🔍', type: 'success' });
      consecutiveWrongRef.current = 0;
    } else {
      setLives(prev => Math.max(0, prev - 1));
      consecutiveWrongRef.current += 1;

      if (consecutiveWrongRef.current >= 3) {
        setFeedback({ message: '💡 İpucu: Aynı özelliği eşleştir!', type: 'warning' });
      } else {
        setFeedback({ message: 'Hmm, bu değildi! 🤔', type: 'error' });
      }
    }

    setGameState(prev => {
      const nextConsecutive = isCorrect ? prev.consecutiveCorrect + 1 : 0;
      let nextRule = prev.currentRule;

      // Rule Shift Logic
      if (nextConsecutive >= CONSECUTIVE_LIMIT) {
        const rules = Object.values(RuleType);
        const availableRules = rules.filter(r => r !== prev.currentRule);
        nextRule = availableRules[Math.floor(Math.random() * availableRules.length)];
        setLevel(l => l + 1);
        setFeedback({ message: '🔄 Kural değişiyor! Hazır mısın?', type: 'warning' });
      }

      return {
        ...prev,
        score: isCorrect ? prev.score + ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level) : prev.score,
        totalAttempts: prev.totalAttempts + 1,
        consecutiveCorrect: nextConsecutive >= CONSECUTIVE_LIMIT ? 0 : nextConsecutive,
        currentRule: nextRule,
        history: [...prev.history, { isCorrect, ruleAtTime: prev.currentRule }],
      };
    });

    // Move to next card
    setTimeout(() => {
      setCurrentCard(generateRandomCard());
      setFeedback(null);
      isResolvingRef.current = false;
    }, 800);
  };

  // Shell status mapping
  const shellStatus: 'START' | 'PLAYING' | 'GAME_OVER' =
    phase === 'idle' ? 'START' :
      phase === 'game_over' ? 'GAME_OVER' : 'PLAYING';

  return (
    <ArcadeGameShell
      gameState={{ score: gameState.score, level, lives, status: shellStatus }}
      gameMetadata={{
        id: 'kart-dedektifi',
        title: 'KART DEDEKTİFİ',
        description: (
          <>
            <p>1. Ortadaki kartı <span className="bg-yellow-300 text-black px-1.5 rounded font-black border-2 border-black/10 rotate-1 inline-block text-xs">renk, şekil</span> veya <span className="bg-emerald-300 text-black px-1.5 rounded font-black border-2 border-black/10 -rotate-1 inline-block text-xs">sayıya</span> göre eşleştir.</p>
            <p>2. Kural her {CONSECUTIVE_LIMIT} doğruda bir <span className="font-black underline decoration-4 underline-offset-4 decoration-rose-400">rastgele değişir!</span></p>
            <p>3. <span className="text-rose-500 font-black">Dedektif dikkatli ol!</span></p>
          </>
        ),
        tuzoCode: '5.2.2 Kural Keşfi / Esnek Düşünce',
        icon: <Search className="w-14 h-14 text-black" strokeWidth={3} />,
        iconBgColor: 'bg-sky-400',
        containerBgColor: 'bg-sky-200 dark:bg-slate-900'
      }}
      onStart={startGame}
      onRestart={startGame}
      showLevel={true}
      showLives={true}
    >
      {/* Game content — only visible during PLAYING phase */}
      {phase === 'playing' && (
        <div className="w-full max-w-4xl flex flex-col items-center pt-20 sm:pt-24 px-4">
          {/* Current Card to Match */}
          <div className="mb-8 sm:mb-12 flex flex-col items-center">
            <p className="text-black dark:text-white bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 px-4 py-1 rounded-full shadow-neo-sm font-black uppercase tracking-widest text-sm mb-4 sm:mb-6 -rotate-2 transition-colors duration-300">Sıradaki Kartın</p>
            <div className="relative">
              <AnimatePresence mode="wait">
                {currentCard && (
                  <motion.div
                    key={currentCard.id}
                    initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    exit={{ scale: 1.2, opacity: 0, rotateY: -90 }}
                    transition={{ type: "spring", damping: 15 }}
                  >
                    <Card card={currentCard} isReference disabled={true} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Reference Cards - User Picks One */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-12">
            {REFERENCE_CARDS.map(ref => (
              <motion.div
                key={ref.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-3 sm:gap-4"
              >
                <Card
                  card={ref}
                  onClick={() => checkMatch(ref)}
                  disabled={isResolvingRef.current}
                />
                <div className="bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-slate-700 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl shadow-neo-sm text-[10px] sm:text-xs font-black uppercase text-black dark:text-white transform rotate-1 transition-colors duration-300">
                  {ref.color} • {ref.shape}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Feedback Banner */}
          <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />
        </div>
      )}
    </ArcadeGameShell>
  );
};

export default KartDedektifi;
