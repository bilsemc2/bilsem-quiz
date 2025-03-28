import React, { useEffect, useState, useCallback } from 'react';
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
} from '../utils/filledEmptyUtils'; // Varsayılan import

// Tipler
interface PuzzleState {
    grid: Shape[];
    options: Shape[];
    questionIndex: number;
    correctIndex: number; // Doğru seçeneğin options dizisindeki index'i
}

interface FeedbackState {
    message: string;
    type: 'correct' | 'incorrect' | 'none';
}

// Bileşen
const FilledEmptyPage: React.FC = () => {
    // Hooklar ve State'ler (Değişiklik yok)
    const navigate = useNavigate();
    const { user, loading: userLoading } = useAuth();
    const { hasEnoughXP, userXP, requiredXP, error: xpError, loading: xpLoading } = useXPCheck(false); // useXPCheck(false) korundu

    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
    const [shapes] = useState<Shape[]>(() => generateShapes());
    const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
    const [feedback, setFeedback] = useState<FeedbackState>({ message: '', type: 'none' });

    // Fonksiyonlar (generateNewPuzzle, handleOptionClick) (Değişiklik yok)
    const generateNewPuzzle = useCallback(() => {
       try {
            const isRowBased = Math.random() < 0.5;
            const puzzleGrid = isRowBased ? generateRowBasedPuzzle(shapes) : generateColumnBasedPuzzle(shapes);
            if (!puzzleGrid || puzzleGrid.length !== 4) { console.error("Invalid grid"); return; }
            const questionIndex = Math.floor(Math.random() * 4);
            const answerShape = puzzleGrid[questionIndex];
            if (!answerShape) { console.error("Answer shape not found"); return; }
            const optionShapes = [answerShape, ...getRandomShapes(shapes, answerShape, 4)].sort(() => Math.random() - 0.5);
            const correctIndexInOptions = optionShapes.findIndex(s => s.type === answerShape.type && s.filled === answerShape.filled);
            setPuzzle({ grid: puzzleGrid, options: optionShapes, questionIndex, correctIndex: correctIndexInOptions });
            setSelectedOptionIndex(null);
            setIsAnswerRevealed(false);
            setFeedback({ message: '', type: 'none' });
        } catch (error) {
            console.error('Error generating puzzle:', error);
            setFeedback({ message: 'Bulmaca yüklenirken hata.', type: 'incorrect' });
            setPuzzle(null);
        }
    }, [shapes]);

     const handleOptionClick = useCallback((index: number) => {
        if (isAnswerRevealed || !puzzle) return;
        setSelectedOptionIndex(index);
        const isCorrect = index === puzzle.correctIndex;
        setFeedback({ type: isCorrect ? 'correct' : 'incorrect', message: isCorrect ? 'Doğru!' : 'Yanlış!' });
        setIsAnswerRevealed(true);
        setTimeout(() => { generateNewPuzzle(); }, 1500);
    }, [isAnswerRevealed, puzzle, generateNewPuzzle]);


    // Effect'ler (Değişiklik yok)
     useEffect(() => { if (!userLoading && !user) navigate('/login'); }, [user, userLoading, navigate]);
     useEffect(() => { if (!userLoading && !xpLoading && user && hasEnoughXP) generateNewPuzzle(); }, [userLoading, xpLoading, user, hasEnoughXP, generateNewPuzzle]);
     useEffect(() => { if (xpError) { console.error('XP Error:', xpError); setFeedback({ message: `XP Error: ${xpError}`, type: 'incorrect'}); }}, [xpError]);

    // --- Render Koşulları (Değişiklik yok, stiller CSS'e taşınabilir) ---
    if (userLoading || xpLoading) return ( <div className="loading-screen"><div className="loading-text">Yükleniyor...</div></div> );
    if (!user) return null;
    if (xpError) return ( <div className="error-screen">XP kontrolü hatası. Tekrar deneyin.</div> );
    if (!hasEnoughXP) return ( <div className="xp-warning-screen"><XPWarning requiredXP={requiredXP} currentXP={userXP} title="Bu bulmaca için yeterli XP'niz yok" /></div> );
    if (!puzzle) return ( <div className="loading-screen"><div className="loading-text">Bulmaca Oluşturuluyor...</div></div> );

    // --- Ana Render (Tasarım Güncellendi) ---
    return (
        // Arka plan gradient'i korundu
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white py-12 px-4">
            <div className="max-w-5xl mx-auto">
                 {/* Başlık ve Açıklama */}
                <div className="text-center mb-12">
                    {/* Başlık gradient'i daha canlı hale getirildi */}
                    <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-500">
                        Dolu-Boş Şekil Bulmacası
                    </h1>
                    {/* Açıklama metni rengi ayarlandı */}
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Şekillerdeki örüntüyü keşfedin ve "?" ile işaretli eksik parçayı bulun.
                    </p>
                </div>

                {/* Ana İçerik Alanı - Daha belirgin arka plan */}
                <div className="bg-slate-800/70 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/60 overflow-hidden">
                    <div className="flex flex-col gap-6 max-w-2xl mx-auto">

                        {/* Bulmaca Grid - Hücre arkaplanı/border güncellendi */}
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
                            {puzzle.grid.map((shape, index) => (
                                <div
                                    key={`grid-${index}`}
                                    className="grid-cell bg-slate-700/60 aspect-square rounded-xl flex items-center justify-center text-4xl font-bold border border-slate-600/50 transition-transform duration-300 hover:scale-105 group"
                                >
                                    {index === puzzle.questionIndex ? (
                                        // Soru işareti rengi ve animasyonu güncellendi
                                        <div className="animate-pulse text-cyan-400/90 text-shadow-cyan text-5xl sm:text-6xl">?</div>
                                    ) : (
                                        // Şekil rengi güncellendi
                                        <svg
                                            viewBox="-2 -2 104 104"
                                            className={`w-16 h-16 text-slate-200 group-hover:text-cyan-300 transition-colors shape ${shape.filled ? 'filled' : 'outline'}`}
                                            dangerouslySetInnerHTML={{ __html: shape.svg }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Seçenekler - Renkler ve efektler güncellendi */}
                        <div className="grid grid-cols-5 gap-3 sm:gap-4">
                            {puzzle.options.map((shape, index) => {
                                const isSelected = selectedOptionIndex === index;
                                const isCorrectOption = index === puzzle.correctIndex;
                                const optionChar = String.fromCharCode(65 + index);

                                return (
                                    <div
                                        key={`option-${index}`}
                                        onClick={() => handleOptionClick(index)}
                                        // Koşullu sınıflar güncellendi (cyan vurgusu, daha belirgin feedback)
                                        className={`
                                            option bg-slate-700/60 aspect-square rounded-xl border border-slate-600/50
                                            flex items-center justify-center relative group backdrop-blur-md
                                            transition-all duration-300
                                            ${isAnswerRevealed
                                                ? 'cursor-not-allowed'
                                                : 'cursor-pointer transform hover:scale-105 hover:bg-slate-600/70 hover:border-cyan-500/70 hover:shadow-lg hover:shadow-cyan-500/20'
                                            }
                                            ${isAnswerRevealed && isCorrectOption ? 'border-green-400/80 bg-green-500/10 scale-105 shadow-xl shadow-green-500/30 ring-2 ring-green-400/50' : ''}
                                            ${isAnswerRevealed && isSelected && !isCorrectOption ? 'border-red-400/80 bg-red-500/10 scale-95 opacity-60 shadow-xl shadow-red-500/30 ring-2 ring-red-400/50' : ''}
                                            ${isAnswerRevealed && !isSelected && !isCorrectOption ? 'opacity-50 scale-95' : ''}
                                            ${!isAnswerRevealed && isSelected ? 'border-cyan-500/80 ring-2 ring-cyan-500/50 scale-105 bg-cyan-500/10' : ''}
                                        `}
                                    >
                                        {/* Şekil rengi güncellendi */}
                                        <svg
                                            viewBox="-2 -2 104 104"
                                            className={`w-12 h-12 sm:w-14 sm:h-14 text-slate-200 group-hover:text-cyan-300 transition-colors shape ${shape.filled ? 'filled' : 'outline'}`}
                                            dangerouslySetInnerHTML={{ __html: shape.svg }}
                                        />
                                        {/* Seçenek Harfi - Renk güncellendi */}
                                        <div className={`absolute -top-2 -right-2 text-xs px-2 py-0.5 rounded-full transition-all backdrop-blur-sm pointer-events-none
                                            ${isAnswerRevealed && isCorrectOption ? 'bg-green-500 text-white' : ''}
                                            ${isAnswerRevealed && isSelected && !isCorrectOption ? 'bg-red-500 text-white' : ''}
                                            ${!isAnswerRevealed ? 'bg-cyan-600/90 text-white opacity-0 group-hover:opacity-100 group-hover:translate-y-1' : ''}
                                            ${isAnswerRevealed && !isSelected && !isCorrectOption ? 'opacity-0' : ''}
                                        `}>
                                            {optionChar}
                                        </div>

                                        {/* Doğru/Yanlış İkonu - Renkler güncellendi */}
                                        {isAnswerRevealed && (
                                            <div className={`absolute inset-0 flex items-center justify-center rounded-xl ${isCorrectOption ? 'bg-green-500/5' : (isSelected ? 'bg-red-500/5' : '')}`}>
                                                {isCorrectOption && (
                                                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                )}
                                                {isSelected && !isCorrectOption && (
                                                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Geribildirim - Renkler güncellendi */}
                        {feedback.type !== 'none' && (
                            <div className={`
                                feedback text-center text-lg font-medium py-3 rounded-xl mt-2
                                border backdrop-blur-lg animate-fadeIn
                                ${feedback.type === 'correct' ? 'text-green-300 bg-green-600/20 border-green-500/30' : ''}
                                ${feedback.type === 'incorrect' ? 'text-red-300 bg-red-600/20 border-red-500/30' : ''}
                            `}>
                                {feedback.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stiller index.css dosyasına taşındı */}
        </div>
    );
};

export default FilledEmptyPage;