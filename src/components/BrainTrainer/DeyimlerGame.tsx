import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import GameOptionButton from './shared/GameOptionButton';
import type { FeedbackResult } from './shared/GameOptionButton';
import { supabase } from '../../lib/supabase';
import { useSound } from '../../hooks/useSound';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import { useGameEngine } from './shared/useGameEngine';
import BrainTrainerShell from './shared/BrainTrainerShell';

const GAME_ID = 'deyimler-oyunu';
const GAME_TITLE = 'Deyimler Oyunu';
const GAME_DESCRIPTION = 'Türkçe deyimlerdeki eksik kelimeyi bul! Sözlü anlama ve kültürel birikimini test et.';
const TUZO_TEXT = 'TUZÖ 5.1.3 Sözlü Anlama';

interface Deyim {
    id: number;
    deyim: string;
    aciklama: string;
    ornek: string | null;
}

interface Question {
    deyim: Deyim;
    missingWord: string;
    displayText: string;
    options: string[];
}

const DeyimlerGame: React.FC = () => {
    const engine = useGameEngine({
        gameId: GAME_ID,
        maxLevel: 20,
        initialLives: 5,
        timeLimit: 180,
    });

    const { playSound } = useSound();
    const safeTimeout = useSafeTimeout();
    const feedback = useGameFeedback({ duration: 2000 });
    const { feedbackState, showFeedback, dismissFeedback } = feedback;

    const { phase, level, addScore, loseLife, nextLevel } = engine;

    const [allDeyimler, setAllDeyimler] = useState<Deyim[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showExplanation, setShowExplanation] = useState(false);

    // Supabase'den deyimleri yükle
    useEffect(() => {
        const fetchDeyimler = async () => {
            const { data, error } = await supabase.from('deyimler').select('*').eq('child_safe', true);
            if (!error && data) {
                setAllDeyimler(data);
            }
            setLoading(false);
        };
        fetchDeyimler();
    }, []);

    const generateQuestion = useCallback((): Question | null => {
        if (allDeyimler.length < 4) return null;

        const randomIndex = Math.floor(Math.random() * allDeyimler.length);
        const selectedDeyim = allDeyimler[randomIndex];

        // Deyimi kelimelere ayır (3+ karakter)
        const words = selectedDeyim.deyim.split(' ').filter(w => w.length > 2);
        if (words.length === 0) return generateQuestion();

        const missingIndex = Math.floor(Math.random() * words.length);
        const missingWord = words[missingIndex];

        // Eksik kelimeli gösterim
        const displayText = selectedDeyim.deyim
            .split(' ')
            .map(w => (w === missingWord ? '______' : w))
            .join(' ');

        // Diğer deyimlerden yanlış seçenekler
        const otherWords = allDeyimler
            .filter(d => d.id !== selectedDeyim.id)
            .flatMap(d => d.deyim.split(' ').filter(w => w.length > 2))
            .filter(w => w !== missingWord);

        const shuffled = [...new Set(otherWords)].sort(() => Math.random() - 0.5);
        const wrongOptions = shuffled.slice(0, 3);
        const options = [...wrongOptions, missingWord].sort(() => Math.random() - 0.5);

        return { deyim: selectedDeyim, missingWord, displayText, options };
    }, [allDeyimler]);

    const startLevel = useCallback(() => {
        const q = generateQuestion();
        setCurrentQuestion(q);
        setSelectedAnswer(null);
        setShowExplanation(false);
    }, [generateQuestion]);

    useEffect(() => {
        if (phase === 'playing' && !currentQuestion && !loading && allDeyimler.length > 0) {
            startLevel();
        } else if (phase === 'welcome' || phase === 'game_over' || phase === 'victory') {
            setCurrentQuestion(null);
            setSelectedAnswer(null);
            setShowExplanation(false);
        }
    }, [phase, currentQuestion, startLevel, loading, allDeyimler.length]);

    const handleAnswer = (answer: string) => {
        if (phase !== 'playing' || !!feedbackState || !currentQuestion || selectedAnswer !== null) return;

        setSelectedAnswer(answer);
        const isCorrect = answer === currentQuestion.missingWord;
        showFeedback(isCorrect);
        playSound(isCorrect ? 'correct' : 'incorrect');

        // Açıklamayı göster
        setShowExplanation(true);

        if (isCorrect) {
            addScore(10 * level);
            safeTimeout(() => {
                dismissFeedback();
                nextLevel();
                if (level < 20) {
                  startLevel();
                }
            }, 2000);
        } else {
            loseLife();
            safeTimeout(() => {
                dismissFeedback();
                if (engine.lives > 1) {
                    startLevel();
                }
            }, 2000);
        }
    };

    const gameConfig = {
        title: GAME_TITLE,
        description: GAME_DESCRIPTION,
        tuzoCode: TUZO_TEXT,
        icon: Languages,
        accentColor: 'cyber-pink',
        maxLevel: 20,
        howToPlay: [
            'Ekrandaki deyimde eksik olan kelimeyi bul.',
            '4 seçenekten doğru kelimeyi seç.',
            'Doğru cevaptan sonra deyimin açıklamasını göreceksin!'
        ],
    };

    if (loading) {
        return (
            <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
                {() => (
                    <div className="flex items-center justify-center flex-1">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-cyber-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-nunito font-black text-sm">
                                Deyimler yükleniyor...
                            </p>
                        </div>
                    </div>
                )}
            </BrainTrainerShell>
        );
    }

    return (
        <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
            {() => (
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full">
                    {phase === 'playing' && currentQuestion && (
                        <motion.div
                            key={`q-${level}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-2xl space-y-4"
                        >
                            {/* Soru Kartı */}
                            <div className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/10 shadow-neo-sm relative text-center">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-cyber-pink text-white px-4 py-1.5 rounded-full font-nunito font-black uppercase tracking-widest text-xs border-2 border-black/10 shadow-neo-sm">
                                    Eksik Kelimeyi Bul
                                </div>

                                <h2 className="text-xl sm:text-2xl font-nunito font-black text-black dark:text-white leading-relaxed mt-4 mb-2">
                                    {selectedAnswer ? currentQuestion.deyim.deyim : currentQuestion.displayText}
                                </h2>

                                {/* Açıklama - cevap sonrası */}
                                {showExplanation && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 pt-4 border-t-2 border-black/5 dark:border-white/10"
                                    >
                                        <p className="text-cyber-pink font-nunito font-black text-xs uppercase tracking-widest mb-1">
                                            Açıklama
                                        </p>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm font-nunito leading-relaxed">
                                            {currentQuestion.deyim.aciklama}
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                            {/* Cevap Butonları */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option === currentQuestion.missingWord;
                                    const showResult = selectedAnswer !== null;

                                    let result: FeedbackResult = null;
                                    if (showResult) {
                                        if (isCorrect) result = "correct";
                                        else if (isSelected) result = "wrong";
                                        else result = "dimmed";
                                    }

                                    return (
                                        <GameOptionButton
                                            key={idx}
                                            variant="text"
                                            label={option}
                                            optionLetter={["A", "B", "C", "D"][idx]}
                                            onClick={() => handleAnswer(option)}
                                            disabled={selectedAnswer !== null || !!feedbackState}
                                            feedbackResult={result}
                                            animationDelay={idx * 0.1}
                                        />
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </BrainTrainerShell>
    );
};

export default DeyimlerGame;
