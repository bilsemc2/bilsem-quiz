import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    Trophy,
    Gamepad2,
    Target,
    Play,
    XCircle,
    Zap,
    Brain,
    Calendar,
    CheckCircle,
    BookOpen,
    RotateCcw,
    User,
    Home,
    ArrowLeft
} from 'lucide-react';

interface QuizResult {
    id: string;
    user_id: string;
    quiz_id: string;
    questions_answered: number;
    correct_answers: number;
    user_answers: UserAnswer[];
    completed_at: string;
}

interface UserAnswer {
    questionImage: string;
    selectedOption: string;
    isCorrect: boolean;
    options: QuizOption[];
}

interface QuizOption {
    id: string;
    imageUrl: string;
    isCorrect: boolean;
}

export default function QuizResultPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState<QuizResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadResult = async () => {
            console.log('loadResult started, quizId:', quizId);
            
            if (!quizId) {
                console.log('No quizId found');
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                console.log('Fetching quiz results for quizId:', quizId);
                // Fetch quiz results - en son tamamlanan quiz sonucunu getir
                const { data: quizData, error: quizError } = await supabase
                    .from('quiz_results')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .order('completed_at', { ascending: false })
                    .limit(1);

                console.log('Supabase response:', { quizData, quizError });

                if (quizError) {
                    console.error('Error fetching quiz result:', quizError);
                    console.error('Error details:', {
                        message: quizError.message,
                        details: quizError.details,
                        hint: quizError.hint,
                        code: quizError.code
                    });
                    setLoading(false);
                    return;
                }

                if (quizData && quizData.length > 0) {
                    console.log('Setting result:', quizData[0]);
                    setResult(quizData[0]);
                } else {
                    console.log('No quiz data found');
                }
            } catch (error) {
                console.error('Error loading result:', error);
            } finally {
                setLoading(false);
                console.log('Loading finished');
            }
        };

        loadResult();
    }, [quizId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
                <motion.div 
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
                        </div>
                        <div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Yükleniyor</span>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Sonuçlar hazırlanıyor...</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
                <motion.div 
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8 max-w-md w-full text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                    
                    <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-3">
                        Quiz Sonucu Bulunamadı
                    </h2>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        Bu quiz için henüz bir sonuç kaydedilmemiş veya quiz henüz tamamlanmamış olabilir.
                    </p>
                    
                    <motion.button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Geri Dön
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
            <div className="container mx-auto px-4 py-8">
                <motion.div 
                    className="max-w-6xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Header */}
                    <motion.div 
                        className="text-center mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                            <Trophy className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                            Quiz Sonucu
                        </h1>
                        
                        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                                {result.completed_at ? new Date(result.completed_at).toLocaleString('tr-TR') : ''}
                            </span>
                        </div>
                    </motion.div>

                    {/* Mini Oyunlar Kartları */}
                    <motion.div 
                        className="mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 max-w-4xl mx-auto">
                            <motion.h3 
                                className="text-xl font-semibold text-center mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Gamepad2 className="w-6 h-6 text-purple-600" />
                                    Mini Oyunlar
                                </div>
                            </motion.h3>
                            
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center text-sm">
                                Quiz sonucuna göre çeşitli eğlenceli oyunları oynayabilirsin
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Top Oyunu Kartı */}
                                <motion.div 
                                    className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-lg p-4 border border-blue-200/50 dark:border-blue-700/50"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center mb-3">
                                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 mr-3">
                                            <Target className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">Top Oyunu</h4>
                                    </div>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-4 leading-relaxed">
                                        Topları hedeflere atarak puan topla! Tüm quiz kullanıcıları için açık.
                                    </p>
                                    <motion.button
                                        onClick={() => navigate('/ball-game', { 
                                            state: { 
                                                fromResult: true,
                                                previousState: { 
                                                    quizId 
                                                }
                                            }
                                        })}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-md transition-all duration-300 text-sm flex items-center justify-center gap-2"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Play className="w-4 h-4" />
                                        Oyna
                                    </motion.button>
                                </motion.div>

                                {/* Baloncuk Sayılar Oyunu Kartı */}
                                <motion.div 
                                    className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl shadow-lg p-4 border border-purple-200/50 dark:border-purple-700/50"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center mb-3">
                                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-2 mr-3">
                                            <Zap className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-purple-800 dark:text-purple-200">Baloncuk Sayılar</h4>
                                    </div>
                                    <p className="text-xs text-purple-700 dark:text-purple-300 mb-2 leading-relaxed">
                                        Doğru hesaplamaları bul ve baloncukları patlat! 
                                        <span className="font-semibold block mt-1">
                                            En az 7 doğru cevap gerektiriyor.
                                        </span>
                                    </p>
                                    {result && result.correct_answers < 7 && (
                                        <div className="bg-purple-200/80 dark:bg-purple-800/30 text-purple-800 dark:text-purple-200 text-xs p-2 rounded-lg mb-3 text-center border border-purple-300/50 dark:border-purple-600/50">
                                            Şu an: {result?.correct_answers || 0}/10 doğru yanıt
                                        </div>
                                    )}
                                    <motion.button
                                        onClick={() => navigate('/bubble-numbers', { 
                                            state: { 
                                                fromResult: true, 
                                                previousState: { 
                                                    quizId, 
                                                    correctAnswers: result?.correct_answers || 0
                                                } 
                                            } 
                                        })}
                                        disabled={!result || result.correct_answers < 7}
                                        className={`w-full ${result && result.correct_answers >= 7 ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' : 'bg-purple-400 cursor-not-allowed'} text-white font-medium py-2.5 px-4 rounded-lg shadow-md transition-all duration-300 text-sm flex items-center justify-center gap-2`}
                                        whileHover={result && result.correct_answers >= 7 ? { scale: 1.05 } : {}}
                                        whileTap={result && result.correct_answers >= 7 ? { scale: 0.95 } : {}}
                                    >
                                        {result && result.correct_answers >= 7 ? (
                                            <>
                                                <Play className="w-4 h-4" />
                                                Oyna
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4" />
                                                Kilitli
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>
                                
                                {/* Hafıza Kartı Oyunu */}
                                <motion.div 
                                    className="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl shadow-lg p-4 border border-amber-200/50 dark:border-amber-700/50"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center mb-3">
                                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-2 mr-3">
                                            <Brain className="w-5 h-5 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-amber-800 dark:text-amber-200">Hafıza Kartları</h4>
                                    </div>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mb-2 leading-relaxed">
                                        Eşleşen resim çiftlerini bul! Hafızanı test et. 
                                        <span className="font-semibold block mt-1">
                                            En az 4 doğru cevap gerektiriyor.
                                        </span>
                                    </p>
                                    {result && result.correct_answers < 4 && (
                                        <div className="bg-amber-200/80 dark:bg-amber-800/30 text-amber-800 dark:text-amber-200 text-xs p-2 rounded-lg mb-3 text-center border border-amber-300/50 dark:border-amber-600/50">
                                            Şu an: {result?.correct_answers || 0}/10 doğru yanıt
                                        </div>
                                    )}
                                    <motion.button
                                        onClick={() => navigate('/memory-cards', { 
                                            state: { 
                                                fromResult: true, 
                                                previousState: { 
                                                    quizId, 
                                                    correctAnswers: result?.correct_answers || 0
                                                } 
                                            } 
                                        })}
                                        disabled={!result || result.correct_answers < 4}
                                        className={`w-full ${result && result.correct_answers >= 4 ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' : 'bg-amber-400 cursor-not-allowed'} text-white font-medium py-2.5 px-4 rounded-lg shadow-md transition-all duration-300 text-sm flex items-center justify-center gap-2`}
                                        whileHover={result && result.correct_answers >= 4 ? { scale: 1.05 } : {}}
                                        whileTap={result && result.correct_answers >= 4 ? { scale: 0.95 } : {}}
                                    >
                                        {result && result.correct_answers >= 4 ? (
                                            <>
                                                <Play className="w-4 h-4" />
                                                Oyna
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4" />
                                                Kilitli
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quiz Sonuçları */}
                    <motion.div 
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        {/* Sol: Ana İstatistikler */}
                        <motion.div 
                            className="lg:col-span-2 space-y-6"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            {/* İstatistik Kartları */}
                            <div className="grid grid-cols-2 gap-4">
                                <motion.div 
                                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Toplam Soru</p>
                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.questions_answered}</p>
                                </motion.div>

                                <motion.div 
                                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                                        <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Doğru Cevap</p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{result.correct_answers}</p>
                                </motion.div>
                            </div>

                            {/* Başarı Yüzdesi */}
                            <motion.div 
                                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7, duration: 0.5 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Başarı Oranı</h3>
                                    <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                                    <motion.div 
                                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(result.correct_answers / result.questions_answered) * 100}%` }}
                                        transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                                <p className="text-2xl font-bold text-center text-yellow-600 dark:text-yellow-400">
                                    {Math.round((result.correct_answers / result.questions_answered) * 100)}%
                                </p>
                            </motion.div>
                        </motion.div>

                        {/* Sağ: Action Butonları */}
                        <motion.div 
                            className="space-y-4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                        >
                            <motion.button
                                onClick={() => navigate('/quiz')}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-4 px-6 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <RotateCcw className="w-5 h-5" />
                                Yeni Quiz Başlat
                            </motion.button>

                            <motion.button
                                onClick={() => navigate('/profile')}
                                className="w-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-800 dark:text-gray-200 font-medium py-4 px-6 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <User className="w-5 h-5" />
                                Profil Sayfası
                            </motion.button>

                            <motion.button
                                onClick={() => navigate('/')}
                                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium py-4 px-6 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Home className="w-5 h-5" />
                                Ana Sayfa
                            </motion.button>
                        </motion.div>
                    </motion.div>

                    {/* Detaylı Soru Sonuçları */}
                    <motion.div 
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
                    >
                        <motion.h3 
                            className="text-xl font-semibold text-center mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                                Detaylı Sonuçlar
                            </div>
                        </motion.h3>

                        <div className="space-y-4">
                            {result.user_answers.map((answer, index) => (
                                <motion.div 
                                    key={index} 
                                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.1 + (index * 0.1), duration: 0.3 }}
                                    whileHover={{ scale: 1.01 }}
                                >
                                    {/* Soru Başlığı */}
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                                            Soru {index + 1}
                                        </h3>
                                        <motion.span 
                                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                                answer.isCorrect
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            }`}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 1.2 + (index * 0.1) }}
                                        >
                                            {answer.isCorrect ? (
                                                <>
                                                    <CheckCircle className="w-3 h-3" />
                                                    Doğru
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-3 h-3" />
                                                    Yanlış
                                                </>
                                            )}
                                        </motion.span>
                                    </div>

                                    {/* Soru Resmi ve Cevaplar */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {/* Sol: Soru Resmi */}
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                                                <img
                                                    src={answer.questionImage}
                                                    alt={`Soru ${index + 1}`}
                                                    className="object-contain w-full h-auto"
                                                />
                                            </div>
                                        </motion.div>

                                        {/* Sağ: Seçenekler */}
                                        <div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {answer.options.map((option) => {
                                                    const displayId = option.id.charAt(option.id.length - 1);
                                                    
                                                    return (
                                                        <motion.div
                                                            key={option.id}
                                                            className={`relative rounded-lg overflow-hidden border-2 ${
                                                                option.id === answer.selectedOption && option.isCorrect
                                                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                                    : option.id === answer.selectedOption
                                                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                                        : option.isCorrect
                                                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                                            }`}
                                                            whileHover={{ scale: 1.05 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <div className="p-2">
                                                                <img
                                                                    src={option.imageUrl}
                                                                    alt={`Seçenek ${displayId}`}
                                                                    className="object-contain w-full h-28"
                                                                />
                                                                <div className="text-center font-bold mt-1 text-gray-800 dark:text-gray-200">
                                                                    {displayId}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                            
                                            {/* Sonuç Açıklaması */}
                                            <motion.div 
                                                className={`mt-3 p-3 rounded-lg ${
                                                    answer.isCorrect
                                                        ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700'
                                                        : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                                                }`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 1.3 + (index * 0.1) }}
                                            >
                                                {answer.isCorrect
                                                    ? 'Doğru cevap verdiniz!'
                                                    : (() => {
                                                        const correctOption = answer.options.find(opt => opt.isCorrect);
                                                        const correctLetter = correctOption ? correctOption.id.charAt(correctOption.id.length - 1) : '';
                                                        return `Yanlış cevap verdiniz. Doğru cevap: ${correctLetter}`;
                                                    })()
                                                }
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}