import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStories } from './services/stories';
import { Story } from './types';
import { CheckCircle2, XCircle, Clock, Trophy, BookOpen, Sparkles, RotateCcw, Home } from 'lucide-react';
import { useGamePersistence } from '../../hooks/useGamePersistence';

type GamePhase = 'welcome' | 'reading' | 'quiz' | 'results';

interface QuizResult {
    questionText: string;
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
}

export default function StoryQuizGame() {
    const navigate = useNavigate();
    const { saveGamePlay } = useGamePersistence();
    const [phase, setPhase] = useState<GamePhase>('welcome');
    const [story, setStory] = useState<Story | null>(null);
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const hasSavedResult = useRef(false);

    // Reading phase
    const [readingTime, setReadingTime] = useState(0);
    const [isReadingTimerActive, setIsReadingTimerActive] = useState(false);

    // Quiz phase
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
    const [questionStartTime, setQuestionStartTime] = useState(0);
    const [totalQuizTime, setTotalQuizTime] = useState(0);

    // Load stories
    useEffect(() => {
        async function loadStories() {
            try {
                const data = await getStories();
                // Filter stories with questions
                const storiesWithQuestions = data.filter(s => s.questions && s.questions.length > 0);
                setStories(storiesWithQuestions);
            } catch (error) {
                console.error('Hikayeler yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        }
        loadStories();
    }, []);

    // Reading timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isReadingTimerActive) {
            interval = setInterval(() => {
                setReadingTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isReadingTimerActive]);

    const selectRandomStory = useCallback(() => {
        if (stories.length === 0) return;
        const randomIndex = Math.floor(Math.random() * stories.length);
        setStory(stories[randomIndex]);
    }, [stories]);

    const startGame = () => {
        window.scrollTo(0, 0);
        selectRandomStory();
        setPhase('reading');
        setReadingTime(0);
        setIsReadingTimerActive(true);
        setScore(0);
        setQuizResults([]);
        setCurrentQuestion(0);
        setTotalQuizTime(0);
        hasSavedResult.current = false; // Reset save flag for new game
    };

    const finishReading = () => {
        setIsReadingTimerActive(false);
        setPhase('quiz');
        setQuestionStartTime(Date.now());
    };

    const handleAnswer = (answerIndex: number) => {
        if (!story) return;

        const question = story.questions[currentQuestion];
        const isCorrect = answerIndex === question.correctAnswer;
        const timeTaken = Date.now() - questionStartTime;

        setSelectedAnswer(answerIndex);
        setShowFeedback(true);
        setTotalQuizTime(prev => prev + timeTaken);

        if (isCorrect) {
            // Bonus points for fast answers (under 10 seconds)
            const timeBonus = timeTaken < 10000 ? Math.floor((10000 - timeTaken) / 1000) : 0;
            setScore(prev => prev + 10 + timeBonus);
        }

        setQuizResults(prev => [...prev, {
            questionText: question.text,
            userAnswer: answerIndex,
            correctAnswer: question.correctAnswer,
            isCorrect
        }]);
    };

    const nextQuestion = () => {
        if (!story) return;

        if (currentQuestion < story.questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedAnswer(null);
            setShowFeedback(false);
            setQuestionStartTime(Date.now());
        } else {
            // Save game result to database
            if (!hasSavedResult.current) {
                hasSavedResult.current = true;
                const correctCount = quizResults.filter(r => r.isCorrect).length +
                    (selectedAnswer === story.questions[currentQuestion].correctAnswer ? 1 : 0);
                const totalDuration = readingTime + Math.floor(totalQuizTime / 1000);

                saveGamePlay({
                    game_id: 'hikaye-quiz',
                    score_achieved: score,
                    duration_seconds: totalDuration,
                    difficulty_played: 'orta',
                    metadata: {
                        story_id: story.id,
                        story_title: story.title,
                        story_theme: story.theme,
                        reading_time_seconds: readingTime,
                        quiz_time_seconds: Math.floor(totalQuizTime / 1000),
                        correct_answers: correctCount,
                        total_questions: story.questions.length,
                        accuracy_percent: Math.round((correctCount / story.questions.length) * 100)
                    }
                });
            }
            setPhase('results');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getScoreEmoji = () => {
        if (!story) return '🎮';
        const percentage = (score / (story.questions.length * 10)) * 100;
        if (percentage >= 80) return '🏆';
        if (percentage >= 60) return '⭐';
        if (percentage >= 40) return '👍';
        return '💪';
    };

    const getThemeColor = (theme: string) => {
        const colors: Record<string, string> = {
            animals: 'from-emerald-500 to-teal-600',
            adventure: 'from-orange-500 to-red-600',
            fantasy: 'from-purple-500 to-pink-600',
            science: 'from-blue-500 to-cyan-600',
            friendship: 'from-rose-500 to-pink-600',
            'life-lessons': 'from-amber-500 to-yellow-600'
        };
        return colors[theme] || 'from-purple-500 to-indigo-600';
    };

    const getThemeName = (theme: string) => {
        const names: Record<string, string> = {
            animals: '🦁 Hayvanlar',
            adventure: '🗺️ Macera',
            fantasy: '🧙 Fantezi',
            science: '🔬 Bilim',
            friendship: '🤝 Arkadaşlık',
            'life-lessons': '💡 Hayat Dersleri'
        };
        return names[theme] || '📖 Hikaye';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
                <div className="text-center">
                    <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl">Hikayeler yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 py-8 px-4">
            {/* Welcome Phase */}
            {phase === 'welcome' && (
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
                        <div className="text-6xl mb-6 animate-bounce">📚</div>
                        <h1 className="text-4xl font-bold text-white mb-4">
                            Hikaye Quiz Oyunu
                        </h1>
                        <p className="text-xl text-purple-200 mb-8">
                            Rastgele bir hikaye oku, sorulara cevap ver ve puan kazan!
                        </p>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-white/10 rounded-xl p-4">
                                <BookOpen className="w-8 h-8 text-white mx-auto mb-2" />
                                <p className="text-white text-sm">Hikaye Oku</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <Clock className="w-8 h-8 text-white mx-auto mb-2" />
                                <p className="text-white text-sm">Süre Tutulur</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <Trophy className="w-8 h-8 text-white mx-auto mb-2" />
                                <p className="text-white text-sm">Puan Kazan</p>
                            </div>
                        </div>

                        <div className="bg-purple-500/30 rounded-xl p-4 mb-8">
                            <p className="text-purple-200 text-sm">
                                <Sparkles className="inline w-4 h-4 mr-1" />
                                {stories.length} hikaye arasından rastgele bir hikaye seçilecek
                            </p>
                        </div>

                        <button
                            onClick={startGame}
                            disabled={stories.length === 0}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            🎮 Oyuna Başla
                        </button>

                        <button
                            onClick={() => navigate('/stories')}
                            className="mt-4 text-purple-300 hover:text-white transition-colors"
                        >
                            ← Hikayelere Dön
                        </button>
                    </div>
                </div>
            )}

            {/* Reading Phase */}
            {phase === 'reading' && story && (
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20 mb-6">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <span className={`px-4 py-2 rounded-full bg-gradient-to-r ${getThemeColor(story.theme)} text-white text-sm font-medium`}>
                                {getThemeName(story.theme)}
                            </span>
                            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                                <Clock className="w-5 h-5 text-white" />
                                <span className="text-white font-mono text-lg">{formatTime(readingTime)}</span>
                            </div>
                        </div>

                        {/* Story Title */}
                        <h1 className="text-3xl font-bold text-white text-center mb-6">{story.title}</h1>

                        {/* Story Image */}
                        {story.image_url && (
                            <div className="relative aspect-video rounded-2xl overflow-hidden mb-6">
                                <img
                                    src={story.image_url}
                                    alt={story.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Story Content */}
                        <div className="bg-white rounded-2xl p-6 shadow-inner">
                            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                                {story.content}
                            </p>
                        </div>

                        {/* Animal Info */}
                        {story.theme === 'animals' && story.animalInfo && (
                            <div className="mt-4 p-4 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                                <p className="text-emerald-200">
                                    <span className="font-bold">🤔 Biliyor muydun?</span> {story.animalInfo}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Finish Reading Button */}
                    <button
                        onClick={finishReading}
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl font-bold rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                        ✅ Okudum, Sorulara Geç
                    </button>

                    <p className="text-center text-purple-300 mt-4 text-sm">
                        Hikayeyi dikkatlice oku, sorularda bu bilgilere ihtiyacın olacak!
                    </p>
                </div>
            )}

            {/* Quiz Phase */}
            {phase === 'quiz' && story && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20">
                        {/* Progress */}
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-purple-200">
                                Soru {currentQuestion + 1} / {story.questions.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-400" />
                                <span className="text-white font-bold">{score} puan</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-white/20 rounded-full h-2 mb-6">
                            <div
                                className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentQuestion + 1) / story.questions.length) * 100}%` }}
                            />
                        </div>

                        {/* Question */}
                        <div className="bg-white rounded-2xl p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">
                                {story.questions[currentQuestion].text}
                            </h2>

                            <div className="space-y-3">
                                {story.questions[currentQuestion].options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswer(index)}
                                        disabled={showFeedback}
                                        className={`w-full p-4 rounded-xl text-left transition-all transform hover:scale-102 ${showFeedback
                                            ? index === story.questions[currentQuestion].correctAnswer
                                                ? 'bg-green-100 border-2 border-green-500 text-green-800'
                                                : index === selectedAnswer
                                                    ? 'bg-red-100 border-2 border-red-500 text-red-800'
                                                    : 'bg-gray-100 border-2 border-transparent text-gray-600'
                                            : 'bg-gray-100 hover:bg-purple-100 border-2 border-transparent hover:border-purple-300'
                                            }`}
                                    >
                                        <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                                    </button>
                                ))}
                            </div>

                            {/* Feedback */}
                            {showFeedback && (
                                <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${selectedAnswer === story.questions[currentQuestion].correctAnswer
                                    ? 'bg-green-100'
                                    : 'bg-red-100'
                                    }`}>
                                    {selectedAnswer === story.questions[currentQuestion].correctAnswer ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <p className={`text-lg ${selectedAnswer === story.questions[currentQuestion].correctAnswer
                                        ? 'text-green-800'
                                        : 'text-red-800'
                                        }`}>
                                        {selectedAnswer === story.questions[currentQuestion].correctAnswer
                                            ? story.questions[currentQuestion].feedback.correct
                                            : story.questions[currentQuestion].feedback.incorrect}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Next Button */}
                        {showFeedback && (
                            <button
                                onClick={nextQuestion}
                                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xl font-bold rounded-2xl hover:from-purple-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                            >
                                {currentQuestion < story.questions.length - 1 ? 'Sonraki Soru →' : '🏆 Sonuçları Gör'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Results Phase */}
            {phase === 'results' && story && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 text-center">
                        <div className="text-8xl mb-6">{getScoreEmoji()}</div>

                        <h1 className="text-4xl font-bold text-white mb-2">Tebrikler!</h1>
                        <p className="text-xl text-purple-200 mb-8">"{story.title}" hikayesini tamamladın</p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/10 rounded-2xl p-6">
                                <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-white">{score}</p>
                                <p className="text-purple-300">Toplam Puan</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-6">
                                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-white">
                                    {quizResults.filter(r => r.isCorrect).length}/{story.questions.length}
                                </p>
                                <p className="text-purple-300">Doğru Cevap</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-6">
                                <BookOpen className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-white">{formatTime(readingTime)}</p>
                                <p className="text-purple-300">Okuma Süresi</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-6">
                                <Clock className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-white">{formatTime(Math.floor(totalQuizTime / 1000))}</p>
                                <p className="text-purple-300">Quiz Süresi</p>
                            </div>
                        </div>

                        {/* Question Results */}
                        <div className="bg-white/5 rounded-2xl p-4 mb-8 text-left">
                            <h3 className="text-white font-semibold mb-4">Soru Detayları:</h3>
                            <div className="space-y-2">
                                {quizResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 p-3 rounded-xl ${result.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                                            }`}
                                    >
                                        {result.isCorrect ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                        )}
                                        <span className={`text-sm ${result.isCorrect ? 'text-green-200' : 'text-red-200'}`}>
                                            Soru {index + 1}: {result.isCorrect ? 'Doğru' : 'Yanlış'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={startGame}
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-6 h-6" />
                                Yeni Hikaye
                            </button>
                            <button
                                onClick={() => navigate('/stories')}
                                className="w-full py-4 bg-white/20 text-white text-xl font-bold rounded-2xl hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                            >
                                <Home className="w-6 h-6" />
                                Hikayelere Dön
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
