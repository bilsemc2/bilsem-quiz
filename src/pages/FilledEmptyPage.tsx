import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useUser } from '../hooks/useUser';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import LoadingSpinner from '../components/LoadingSpinner';
import {
    Shape,
    generateShapes,
    generateRowBasedPuzzle,
    generateColumnBasedPuzzle,
    getRandomShapes
} from '../utils/filledEmptyUtils';

const FilledEmptyPage: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { currentUser, loading: userLoading } = useUser();
    const { hasEnoughXP, userXP, requiredXP, error: xpError, loading: xpLoading } = useXPCheck(currentUser?.id, '/filled-empty');
    
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState<string>('');
    const [shapes] = useState<Shape[]>(() => generateShapes());
    const [puzzle, setPuzzle] = useState<{
        grid: Shape[];
        options: Shape[];
        questionIndex: number;
    }>({
        grid: [],
        options: [],
        questionIndex: 0
    });
    const [feedback, setFeedback] = useState<{
        message: string;
        type: 'correct' | 'incorrect' | 'none';
    }>({
        message: '',
        type: 'none'
    });

    const generatePuzzle = useCallback(() => {
        try {
            // Rastgele bir kural seç ve bulmacayı oluştur
            const isRowBased = Math.random() < 0.5;
            const puzzleShapes = isRowBased 
                ? generateRowBasedPuzzle(shapes)
                : generateColumnBasedPuzzle(shapes);

            if (!puzzleShapes || puzzleShapes.length === 0) {
                return;
            }

            // Soru pozisyonunu belirle
            const questionIndex = Math.floor(Math.random() * 4);
            const answerShape = puzzleShapes[questionIndex];

            if (!answerShape) {
                return;
            }

            // Seçenekleri oluştur
            const options = [answerShape, ...getRandomShapes(shapes, answerShape, 4)]
                .sort(() => Math.random() - 0.5);

            // State'i güncelle
            setPuzzle({
                grid: puzzleShapes,
                options,
                questionIndex
            });

            // Doğru cevabı kaydet
            const correctIndex = options.findIndex(s => 
                s.type === answerShape.type && s.filled === answerShape.filled
            );
            setCorrectAnswer(String.fromCharCode(65 + correctIndex));

            // Seçimi ve geribildirimi sıfırla
            setSelectedOption(null);
            setShowAnswer(false);
            setFeedback({ message: '', type: 'none' });

        } catch (error) {
            console.error('Bulmaca oluşturulurken hata:', error);
        }
    }, [shapes]);

    const handleOptionClick = async (event: React.MouseEvent<HTMLDivElement>) => {
        const optionElement = event.currentTarget;
        const option = optionElement.dataset.option;
        if (!option) return;
        
        const optionIndex = option.charCodeAt(0) - 65;
        setSelectedOption(optionIndex);
        
        const isCorrect = puzzle.options[optionIndex].svg === puzzle.grid[puzzle.questionIndex].svg;
        setFeedback({
            type: isCorrect ? 'correct' : 'incorrect',
            message: isCorrect ? 'Doğru!' : 'Yanlış!'
        });

        setShowAnswer(true);
        
        // 1.5 saniye sonra yeni soruya geç
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSelectedOption(null);
        setShowAnswer(false);
        setFeedback({ type: 'none', message: '' });
        generatePuzzle();
    };

    useEffect(() => {
        if (!userLoading && !xpLoading && hasEnoughXP) {
            generatePuzzle();
        }
    }, [generatePuzzle, userLoading, xpLoading, hasEnoughXP]);

    useEffect(() => {
        if (xpError) {
            console.error('XP kontrolü hatası:', xpError);
        }
    }, [xpError]);

    // Yükleniyor durumu
    if (userLoading || xpLoading) {
        return <LoadingSpinner />;
    }

    // Kullanıcı giriş yapmamış
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-12 px-4 flex items-center justify-center">
                <XPWarning 
                    requiredXP={0} 
                    currentXP={0} 
                    title="Bu sayfayı görmek için giriş yapmalısınız" 
                />
            </div>
        );
    }

    // XP hatası
    if (xpError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-12 px-4 flex items-center justify-center">
                <XPWarning 
                    requiredXP={requiredXP} 
                    currentXP={userXP} 
                    title={`XP kontrolü yapılamadı: ${xpError}`} 
                />
            </div>
        );
    }

    // XP yetersiz
    if (!hasEnoughXP) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-12 px-4 flex items-center justify-center">
                <XPWarning 
                    requiredXP={requiredXP} 
                    currentXP={userXP} 
                    title="Dolu-Boş Şekil Bulmacası sayfasına erişim için yeterli XP'niz yok" 
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-12 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-400 to-violet-500">
                        Dolu-Boş Şekil Bulmacası
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Şekillerdeki örüntüyü keşfedin ve eksik parçayı bulun.
                    </p>
                </div>
                
                <div ref={containerRef} className="bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/50 overflow-hidden">
                    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                        {/* Bulmaca Grid */}
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
                            {puzzle.grid.map((shape, index) => (
                                <div
                                    key={index}
                                    className="grid-cell bg-gray-700/30 aspect-square rounded-xl flex items-center justify-center text-3xl font-bold transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-600/20 overflow-hidden backdrop-blur-lg group"
                                >
                                    {index === puzzle.questionIndex ? (
                                        <div className="question-mark group-hover:text-pink-400 transition-colors">?</div>
                                    ) : (
                                        <svg 
                                            viewBox="-2 -2 104 104" 
                                            className="w-16 h-16 text-gray-200 group-hover:text-white transition-colors" 
                                            dangerouslySetInnerHTML={{ __html: shape.svg }} 
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Seçenekler */}
                        <div className="grid grid-cols-5 gap-4">
                            {puzzle.options.map((shape, index) => {
                                const isSelected = selectedOption === index;
                                const isCorrect = shape.svg === puzzle.grid[puzzle.questionIndex].svg;
                                
                                let optionClass = "option bg-gray-700/30 aspect-square rounded-xl cursor-pointer border border-gray-600/20 transform transition-all duration-300 hover:scale-105 hover:bg-gray-600/30 hover:border-purple-500/50 hover:shadow-2xl flex items-center justify-center relative group overflow-hidden backdrop-blur-lg";
                                
                                if (showAnswer) {
                                    if (isCorrect) {
                                        optionClass += " border-green-500 bg-green-500/20";
                                    } else if (isSelected) {
                                        optionClass += " border-red-500 bg-red-500/20";
                                    }
                                }

                                return (
                                    <div
                                        key={index}
                                        data-option={String.fromCharCode(65 + index)}
                                        onClick={!showAnswer ? handleOptionClick : undefined}
                                        className={optionClass}
                                    >
                                        <svg 
                                            viewBox="-2 -2 104 104" 
                                            className="w-14 h-14 text-gray-200 group-hover:text-white transition-colors" 
                                            dangerouslySetInnerHTML={{ __html: shape.svg }} 
                                        />
                                        <div className="absolute -top-2 -right-2 bg-purple-600/80 text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-y-2 backdrop-blur-sm">
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        {showAnswer && (
                                            <div className={`absolute inset-0 flex items-center justify-center rounded-xl ${isCorrect ? 'bg-green-500/20' : (isSelected ? 'bg-red-500/20' : '')}`}>
                                                {isCorrect && (
                                                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                                {isSelected && !isCorrect && (
                                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Geribildirim */}
                        {feedback.type !== 'none' && (
                            <div className={`feedback text-center text-base py-3 rounded-xl transition-all duration-500 ${feedback.type} backdrop-blur-lg`}>
                                {feedback.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .shape.filled { 
                    fill: currentColor; 
                    stroke: none;
                    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
                }
                .shape.outline { 
                    fill: none; 
                    stroke: currentColor; 
                    stroke-width: 2; 
                    vector-effect: non-scaling-stroke;
                    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.1));
                }
                .question-mark { 
                    font-size: 4rem; 
                    color: #9CA3AF; 
                    opacity: 0.8; 
                    animation: pulse 2s infinite;
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
                }
                .option.selected { 
                    border: 2px solid transparent; 
                    background: linear-gradient(45deg, rgba(219, 39, 119, 0.2), rgba(124, 58, 237, 0.2)); 
                    box-shadow: 0 0 30px rgba(124, 58, 237, 0.3);
                    transform: scale(1.05);
                }
                .feedback.correct { 
                    color: #10B981; 
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    animation: fadeIn 0.5s ease-out;
                }
                .feedback.incorrect { 
                    color: #EF4444; 
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes pulse { 
                    0% { transform: scale(1); } 
                    50% { transform: scale(1.1); } 
                    100% { transform: scale(1); }
                }
                @keyframes fadeIn { 
                    from { 
                        opacity: 0; 
                        transform: translateY(-10px); 
                    } 
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
            `}</style>
        </div>
    );
};

export default FilledEmptyPage;