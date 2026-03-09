import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, RuleType, Color, Shape } from './types';
import { REFERENCE_CARDS, CONSECUTIVE_LIMIT } from './constants';
import Card from './components/Card';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE } from '../../Shared/ArcadeConstants';
import { useArcadeGameSession } from '../../Shared/useArcadeGameSession';

const KartDedektifi: React.FC = () => {
  const location = useLocation();
  const {
    sessionState,
    startSession,
    addScore,
    advanceLevel,
    loseLife,
    finishGame,
    recordAttempt
  } = useArcadeGameSession({ gameId: 'kart-dedektifi' });

  const [currentRule, setCurrentRule] = useState<RuleType>(RuleType.Color);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const promptStartedAtRef = useRef(0);
  const isResolvingRef = useRef(false);
  const consecutiveWrongRef = useRef(0);

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

  const startGame = useCallback(() => {
    window.scrollTo(0, 0);
    startSession();
    setCurrentRule(RuleType.Color);
    setConsecutiveCorrect(0);
    setFeedback(null);
    setCurrentCard(generateRandomCard());
    promptStartedAtRef.current = Date.now();
    isResolvingRef.current = false;
    consecutiveWrongRef.current = 0;
  }, [generateRandomCard, startSession]);

  useEffect(() => {
    if (location.state?.autoStart && sessionState.status === 'START') {
      startGame();
    }
  }, [location.state, sessionState.status, startGame]);

  useEffect(() => {
    if (sessionState.lives <= 0 && sessionState.status === 'PLAYING') {
      isResolvingRef.current = true;
      void finishGame({ status: 'GAME_OVER' });
    }
  }, [finishGame, sessionState.lives, sessionState.status]);

  useEffect(() => {
    if (!currentCard && sessionState.status !== 'GAME_OVER') {
      setCurrentCard(generateRandomCard());
    }
  }, [currentCard, generateRandomCard, sessionState.status]);

  const checkMatch = useCallback((refCard: CardData) => {
    if (!currentCard || sessionState.status !== 'PLAYING' || isResolvingRef.current) {
      return;
    }

    isResolvingRef.current = true;
    let isCorrect = false;

    if (currentRule === RuleType.Color) {
      isCorrect = currentCard.color === refCard.color;
    } else if (currentRule === RuleType.Shape) {
      isCorrect = currentCard.shape === refCard.shape;
    } else if (currentRule === RuleType.Number) {
      isCorrect = currentCard.number === refCard.number;
    }

    recordAttempt({
      isCorrect,
      responseMs: promptStartedAtRef.current > 0 ? Date.now() - promptStartedAtRef.current : null
    });

    if (isCorrect) {
      addScore(ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, sessionState.level));
      setFeedback({ message: 'Dedektif iş başında! 🔍', type: 'success' });
      consecutiveWrongRef.current = 0;
    } else {
      loseLife();
      consecutiveWrongRef.current += 1;

      if (consecutiveWrongRef.current >= 3) {
        setFeedback({ message: '💡 İpucu: Aynı özelliği eşleştir!', type: 'warning' });
      } else {
        setFeedback({ message: 'Hmm, bu değildi! 🤔', type: 'error' });
      }
    }

    const nextConsecutive = isCorrect ? consecutiveCorrect + 1 : 0;
    if (nextConsecutive >= CONSECUTIVE_LIMIT) {
      const rules = Object.values(RuleType);
      const availableRules = rules.filter((rule) => rule !== currentRule);
      const nextRule = availableRules[Math.floor(Math.random() * availableRules.length)];

      advanceLevel();
      setCurrentRule(nextRule);
      setConsecutiveCorrect(0);
      setFeedback({ message: '🔄 Kural değişiyor! Hazır mısın?', type: 'warning' });
    } else {
      setConsecutiveCorrect(nextConsecutive);
    }

    setTimeout(() => {
      setCurrentCard(generateRandomCard());
      setFeedback(null);
      isResolvingRef.current = false;
      promptStartedAtRef.current = Date.now();
    }, 800);
  }, [
    addScore,
    advanceLevel,
    consecutiveCorrect,
    currentCard,
    currentRule,
    generateRandomCard,
    loseLife,
    recordAttempt,
    sessionState.level,
    sessionState.status
  ]);

  return (
    <ArcadeGameShell
      gameState={sessionState}
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
      {sessionState.status === 'PLAYING' && (
        <div className="w-full max-w-4xl flex flex-col items-center pt-20 sm:pt-24 px-4">
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
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <Card card={currentCard} isReference disabled={true} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-12">
            {REFERENCE_CARDS.map((ref) => (
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

          <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />
        </div>
      )}
    </ArcadeGameShell>
  );
};

export default KartDedektifi;
