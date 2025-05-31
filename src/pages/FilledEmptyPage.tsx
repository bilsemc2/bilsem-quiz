import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import {
    Shape,
    generateShapes,
    generateRowBasedPuzzle,
    generateColumnBasedPuzzle,
    getRandomShapes
} from '../utils/filledEmptyUtils';

// Tipler
interface PuzzleState {
    grid: Shape[];
    options: Shape[];
    questionIndex: number;
    correctIndex: number;
}

interface FeedbackState {
    message: string;
    type: 'correct' | 'incorrect' | 'none';
}

// Sabitler
const FEEDBACK_DELAY = 1500;
const GRID_SIZE = 4;
const OPTIONS_COUNT = 5;

// Yükleme bileşeni - Geliştirildi
const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
            <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-cyan-400/30 border-t-cyan-400 mx-auto mb-6"></div>
                <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-transparent border-r-emerald-400 animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
            </div>
            <div className="text-white text-xl font-medium">{message}</div>
            <div className="mt-2 text-slate-400 text-sm animate-pulse">Lütfen bekleyin...</div>
        </div>
    </div>
);

// Hata bileşeni - Geliştirildi
const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-md backdrop-blur-lg">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <div className="text-red-300 text-xl mb-4 font-medium">{message}</div>
            {onRetry && (
                <button 
                    onClick={onRetry}
                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                >
                    🔄 Tekrar Dene
                </button>
            )}
        </div>
    </div>
);

// İlerleme çubuğu bileşeni - Yeni
const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
    const percentage = (current / total) * 100;
    return (
        <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
            <div 
                className="bg-gradient-to-r from-cyan-400 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

// Başarı animasyonu bileşeni - Yeni
const SuccessAnimation: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none">
        <div className="animate-ping absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-green-400/20 rounded-full"></div>
        <div className="animate-pulse absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl">🎉</div>
    </div>
);

// Grid hücresi bileşeni - Geliştirildi
const GridCell: React.FC<{
    shape?: Shape;
    isQuestion: boolean;
    index: number;
}> = React.memo(({ shape, isQuestion, index }) => (
    <div className="relative group">
        <div className="grid-cell bg-slate-700/60 aspect-square rounded-2xl flex items-center justify-center text-4xl font-bold border border-slate-600/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 group">
            {isQuestion ? (
                <div className="relative">
                    <div className="animate-pulse text-cyan-400/90 text-5xl sm:text-6xl font-bold drop-shadow-lg">
                        ?
                    </div>
                    <div className="absolute inset-0 animate-ping text-cyan-400/30 text-5xl sm:text-6xl font-bold">
                        ?
                    </div>
                </div>
            ) : shape ? (
                <svg
                    viewBox="-2 -2 104 104"
                    className={`w-16 h-16 text-slate-200 group-hover:text-cyan-300 transition-all duration-300 drop-shadow-lg shape ${shape.filled ? 'filled' : 'outline'}`}
                    dangerouslySetInnerHTML={{ __html: shape.svg }}
                />
            ) : null}
        </div>
        {/* Grid pozisyon göstergesi */}
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-600/80 rounded-full flex items-center justify-center text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
            {index + 1}
        </div>
    </div>
));

// Seçenek bileşeni - Geliştirildi
const OptionButton: React.FC<{
    shape: Shape;
    index: number;
    isSelected: boolean;
    isCorrect: boolean;
    isAnswerRevealed: boolean;
    onClick: (index: number) => void;
}> = React.memo(({ shape, index, isSelected, isCorrect, isAnswerRevealed, onClick }) => {
    const optionChar = String.fromCharCode(65 + index);
    
    const getButtonClasses = useMemo(() => {
        const baseClasses = "option bg-slate-700/60 aspect-square rounded-2xl border border-slate-600/50 flex items-center justify-center relative group backdrop-blur-md transition-all duration-300";
        
        if (isAnswerRevealed) {
            if (isCorrect) {
                return `${baseClasses} cursor-not-allowed border-green-400/80 bg-green-500/20 scale-110 shadow-2xl shadow-green-500/40 ring-4 ring-green-400/50`;
            }
            if (isSelected) {
                return `${baseClasses} cursor-not-allowed border-red-400/80 bg-red-500/20 scale-95 opacity-70 shadow-2xl shadow-red-500/40 ring-4 ring-red-400/50`;
            }
            return `${baseClasses} cursor-not-allowed opacity-40 scale-90`;
        }
        
        if (isSelected) {
            return `${baseClasses} cursor-pointer border-cyan-500/80 ring-4 ring-cyan-500/50 scale-110 bg-cyan-500/20 shadow-xl shadow-cyan-500/30`;
        }
        
        return `${baseClasses} cursor-pointer transform hover:scale-110 hover:bg-slate-600/80 hover:border-cyan-500/70 hover:shadow-xl hover:shadow-cyan-500/30 active:scale-95`;
    }, [isAnswerRevealed, isCorrect, isSelected]);

    return (
        <div className="relative">
            <div
                onClick={() => !isAnswerRevealed && onClick(index)}
                className={getButtonClasses}
                role="button"
                tabIndex={isAnswerRevealed ? -1 : 0}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isAnswerRevealed) {
                        e.preventDefault();
                        onClick(index);
                    }
                }}
                aria-label={`Seçenek ${optionChar}`}
            >
                <svg
                    viewBox="-2 -2 104 104"
                    className={`w-12 h-12 sm:w-14 sm:h-14 text-slate-200 group-hover:text-cyan-300 transition-all duration-300 drop-shadow-lg shape ${shape.filled ? 'filled' : 'outline'}`}
                    dangerouslySetInnerHTML={{ __html: shape.svg }}
                />
                
                {/* Seçenek Harfi - Geliştirildi */}
                <div className={`absolute -top-3 -right-3 text-sm px-3 py-1 rounded-full transition-all backdrop-blur-sm pointer-events-none font-bold
                    ${isAnswerRevealed && isCorrect ? 'bg-green-500 text-white shadow-lg shadow-green-500/50' : ''}
                    ${isAnswerRevealed && isSelected && !isCorrect ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' : ''}
                    ${!isAnswerRevealed ? 'bg-cyan-600/90 text-white opacity-0 group-hover:opacity-100 group-hover:translate-y-1 group-hover:scale-110' : ''}
                    ${isAnswerRevealed && !isSelected && !isCorrect ? 'opacity-0' : ''}
                `}>
                    {optionChar}
                </div>

                {/* Doğru/Yanlış İkonu - Geliştirildi */}
                {isAnswerRevealed && (
                    <div className={`absolute inset-0 flex items-center justify-center rounded-2xl ${isCorrect ? 'bg-green-500/10' : (isSelected ? 'bg-red-500/10' : '')}`}>
                        {isCorrect && (
                            <div className="relative">
                                <svg className="w-10 h-10 text-green-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <div className="absolute inset-0 animate-ping">
                                    <svg className="w-10 h-10 text-green-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        )}
                        {isSelected && !isCorrect && (
                            <div className="relative">
                                <svg className="w-10 h-10 text-red-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <div className="absolute inset-0 animate-pulse">
                                    <svg className="w-10 h-10 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Klavye kısayolu göstergesi */}
            {!isAnswerRevealed && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {optionChar}
                </div>
            )}
        </div>
    );
});

// Ana bileşen
const FilledEmptyPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: userLoading } = useAuth();
    const { hasEnoughXP, userXP, requiredXP, error: xpError, loading: xpLoading } = useXPCheck(false);

    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
    const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
    const [feedback, setFeedback] = useState<FeedbackState>({ message: '', type: 'none' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [score, setScore] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    // Şekilleri memoize et
    const shapes = useMemo(() => generateShapes(), []);

    // Yeni bulmaca oluştur
    const generateNewPuzzle = useCallback(async () => {
        if (isGenerating) return;
        
        setIsGenerating(true);
        try {
            // UI güncellemesi için kısa bir gecikme
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const isRowBased = Math.random() < 0.5;
            const puzzleGrid = isRowBased 
                ? generateRowBasedPuzzle(shapes) 
                : generateColumnBasedPuzzle(shapes);
            
            if (!puzzleGrid || puzzleGrid.length !== GRID_SIZE) {
                throw new Error("Geçersiz grid oluşturuldu");
            }
            
            const questionIndex = Math.floor(Math.random() * GRID_SIZE);
            const answerShape = puzzleGrid[questionIndex];
            
            if (!answerShape) {
                throw new Error("Cevap şekli bulunamadı");
            }
            
            const optionShapes = [answerShape, ...getRandomShapes(shapes, answerShape, OPTIONS_COUNT - 1)]
                .sort(() => Math.random() - 0.5);
            
            const correctIndexInOptions = optionShapes.findIndex(
                s => s.type === answerShape.type && s.filled === answerShape.filled
            );
            
            setPuzzle({
                grid: puzzleGrid,
                options: optionShapes,
                questionIndex,
                correctIndex: correctIndexInOptions
            });
            
            setSelectedOptionIndex(null);
            setIsAnswerRevealed(false);
            setFeedback({ message: '', type: 'none' });
            setShowSuccess(false);
        } catch (error) {
            console.error('Bulmaca oluşturma hatası:', error);
            setFeedback({ 
                message: 'Bulmaca yüklenirken hata oluştu. Tekrar deneyin.', 
                type: 'incorrect' 
            });
        } finally {
            setIsGenerating(false);
        }
    }, [shapes, isGenerating]);

    // Seçenek tıklama işleyicisi - Geliştirildi
    const handleOptionClick = useCallback((index: number) => {
        if (isAnswerRevealed || !puzzle || isGenerating) return;
        
        setSelectedOptionIndex(index);
        const isCorrect = index === puzzle.correctIndex;
        
        setTotalQuestions(prev => prev + 1);
        
        if (isCorrect) {
            setScore(prev => prev + 1);
            setShowSuccess(true);
            setFeedback({
                type: 'correct',
                message: '🎉 Mükemmel! Doğru cevap!'
            });
        } else {
            setFeedback({
                type: 'incorrect',
                message: '❌ Yanlış! Tekrar deneyin.'
            });
        }
        
        setIsAnswerRevealed(true);
        
        // Sonraki bulmacayı oluştur
        setTimeout(() => {
            generateNewPuzzle();
        }, FEEDBACK_DELAY);
    }, [isAnswerRevealed, puzzle, generateNewPuzzle, isGenerating]);

    // Klavye desteği - Geliştirildi
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (isAnswerRevealed || !puzzle) return;
            
            const key = event.key.toUpperCase();
            const optionIndex = key.charCodeAt(0) - 65; // A=0, B=1, etc.
            
            if (optionIndex >= 0 && optionIndex < puzzle.options.length) {
                event.preventDefault();
                handleOptionClick(optionIndex);
            }
            
            // ESC tuşu ile yeni bulmaca
            if (event.key === 'Escape' && !isGenerating) {
                generateNewPuzzle();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isAnswerRevealed, puzzle, handleOptionClick, generateNewPuzzle, isGenerating]);

    // Effect'ler
    useEffect(() => {
        if (!userLoading && !user) {
            navigate('/login');
        }
    }, [user, userLoading, navigate]);

    useEffect(() => {
        if (!userLoading && !xpLoading && user && hasEnoughXP && !puzzle && !isGenerating) {
            generateNewPuzzle();
        }
    }, [userLoading, xpLoading, user, hasEnoughXP, puzzle, generateNewPuzzle, isGenerating]);

    useEffect(() => {
        if (xpError) {
            console.error('XP Error:', xpError);
            setFeedback({ 
                message: `XP kontrolü hatası: ${xpError}`, 
                type: 'incorrect'
            });
        }
    }, [xpError]);

    // Render koşulları
    if (userLoading || xpLoading) {
        return <LoadingSpinner message="Yükleniyor..." />;
    }
    
    if (!user) return null;
    
    if (xpError) {
        return <ErrorMessage message="XP kontrolü hatası. Lütfen tekrar deneyin." onRetry={() => window.location.reload()} />;
    }
    
    if (!hasEnoughXP) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
                <XPWarning 
                    requiredXP={requiredXP} 
                    currentXP={userXP} 
                    title="Bu bulmaca için yeterli XP'niz yok" 
                />
            </div>
        );
    }
    
    if (!puzzle || isGenerating) {
        return <LoadingSpinner message="Bulmaca oluşturuluyor..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white py-6 px-4 relative overflow-hidden">
            {/* Arka plan efektleri */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            
            {/* Başarı animasyonu */}
            {showSuccess && <SuccessAnimation />}
            
            <div className="max-w-5xl mx-auto relative z-10">
                {/* Üst bilgi çubuğu */}
                <div className="flex justify-between items-center mb-6 bg-slate-800/50 backdrop-blur-lg rounded-2xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-300">
                            <span className="font-medium">Skor:</span> 
                            <span className="text-cyan-400 font-bold ml-1">{score}</span>
                            <span className="text-slate-500 mx-1">/</span>
                            <span className="text-slate-400">{totalQuestions}</span>
                        </div>
                        {totalQuestions > 0 && (
                            <div className="text-sm text-slate-300">
                                <span className="font-medium">Başarı:</span> 
                                <span className="text-emerald-400 font-bold ml-1">
                                    {Math.round((score / totalQuestions) * 100)}%
                                </span>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => !isGenerating && generateNewPuzzle()}
                        disabled={isGenerating}
                        className="bg-slate-700/60 hover:bg-slate-600/60 border border-slate-600/50 text-slate-300 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        🔄 Yeni Bulmaca
                    </button>
                </div>

                {/* Başlık ve Açıklama */}
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-500 drop-shadow-lg">
                        Dolu-Boş Şekil Bulmacası
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-4">
                        Şekillerdeki örüntüyü keşfedin ve "?" ile işaretli eksik parçayı bulun.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-lg">
                            ⌨️ <span>A-E tuşları ile seçim</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-lg">
                            🔄 <span>ESC ile yeni bulmaca</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-lg">
                            🎯 <span>Örüntüyü takip edin</span>
                        </div>
                    </div>
                </header>

                {/* Ana İçerik */}
                <main className="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-700/50 relative">
                    <div className="flex flex-col gap-10 max-w-2xl mx-auto">
                        {/* Bulmaca Grid */}
                        <section className="grid grid-cols-2 gap-6 max-w-sm mx-auto w-full" role="grid" aria-label="Bulmaca grid">
                            {puzzle.grid.map((shape, index) => (
                                <GridCell
                                    key={`grid-${index}`}
                                    shape={shape}
                                    isQuestion={index === puzzle.questionIndex}
                                    index={index}
                                />
                            ))}
                        </section>

                        {/* Seçenekler */}
                        <section className="grid grid-cols-5 gap-4 sm:gap-6" role="radiogroup" aria-label="Cevap seçenekleri">
                            {puzzle.options.map((shape, index) => (
                                <OptionButton
                                    key={`option-${index}`}
                                    shape={shape}
                                    index={index}
                                    isSelected={selectedOptionIndex === index}
                                    isCorrect={index === puzzle.correctIndex}
                                    isAnswerRevealed={isAnswerRevealed}
                                    onClick={handleOptionClick}
                                />
                            ))}
                        </section>

                        {/* Geribildirim */}
                        {feedback.type !== 'none' && (
                            <div 
                                className={`text-center text-xl font-bold py-6 rounded-2xl border backdrop-blur-lg animate-fadeIn transition-all duration-500 relative overflow-hidden
                                    ${feedback.type === 'correct' 
                                        ? 'text-green-200 bg-green-600/30 border-green-500/50 shadow-2xl shadow-green-500/30' 
                                        : 'text-red-200 bg-red-600/30 border-red-500/50 shadow-2xl shadow-red-500/30'
                                    }
                                `}
                                role="alert"
                                aria-live="polite"
                            >
                                <div className="relative z-10">{feedback.message}</div>
                                {feedback.type === 'correct' && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/20 to-green-500/10 animate-pulse"></div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default FilledEmptyPage;