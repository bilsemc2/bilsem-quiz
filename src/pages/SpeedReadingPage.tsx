import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Play, 
  Square, 
  Pause,
  Target, 
  Zap, 
  Eye, 
  ArrowRight,
  ChevronRight,
  Trophy,
  XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import RequireAuth from '../components/RequireAuth';

// --- Types ---
interface StoryQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_option: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  story_questions?: StoryQuestion[];
}

interface ReadingResults {
  wpm: number;
  timeTaken: number;
  comprehension: number;
}

// --- Bileşen ---
const SpeedReadingPageContent: React.FC = () => {
    // --- State'ler ---
    const [activeMode, setActiveMode] = useState<'normal' | 'rsvp' | 'pacing'>('normal');
    const [readingTextsList, setReadingTextsList] = useState<Story[]>([]);
    const [textsLoading, setTextsLoading] = useState(true);
    const [selectedText, setSelectedText] = useState<Story | null>(null);
    const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
    const [showQuestions, setShowQuestions] = useState(false);
    const [answers, setAnswers] = useState<number[]>([]);
    const [readingResults, setReadingResults] = useState<ReadingResults | null>(null);

    // RSVP State'leri
    const [rsvpSpeedWpm, setRsvpSpeedWpm] = useState<number>(300);
    const [rsvpWords, setRsvpWords] = useState<string[]>([]);
    const [rsvpCurrentIndex, setRsvpCurrentIndex] = useState<number>(0);
    const [rsvpIntervalId, setRsvpIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [isRsvpRunning, setIsRsvpRunning] = useState<boolean>(false);
    const rsvpContainerRef = useRef<HTMLDivElement>(null);
    
    // Pacing State'leri
    const [pacingSpeedWpm, setPacingSpeedWpm] = useState<number>(250);
    const [pacingChunkSize, setPacingChunkSize] = useState<number>(1);
    const [pacingCurrentChunkIndex, setPacingCurrentChunkIndex] = useState<number>(0);
    const [pacingIntervalId, setPacingIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [isPacingRunning, setIsPacingRunning] = useState<boolean>(false);
    const [pacingWords, setPacingWords] = useState<string[]>([]);
    
    useEffect(() => {
        if (selectedText) {
            const words = selectedText.content.trim().split(/\s+/).filter(Boolean);
            setPacingWords(words);
        }
    }, [selectedText]);

    const navigate = useNavigate();
    const { user, loading: userLoading } = useAuth();

    // --- Hooklar ---
    useEffect(() => { if (!userLoading && !user) navigate('/login'); }, [user, userLoading, navigate]);

    // Veri Çekme Effect'i
    useEffect(() => {
        const fetchTexts = async () => {
            if (!user) return;
            setTextsLoading(true);
            try {
                // Hikayeleri ve ilişkili soruları tek sorguda çek
                const { data, error } = await supabase
                    .from('story')
                    .select(`
                        id,
                        title,
                        content,
                        story_questions ( id, question_text, options, correct_option )
                    `)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    setReadingTextsList(data as Story[]);
                    const firstText = data[0] as Story;
                    setSelectedText(firstText);
                    // İlk metin için cevap dizisini başlat
                    setAnswers(new Array(firstText.story_questions?.length || 0).fill(undefined));
                } else {
                    // Veri yoksa veya boşsa, örnek veri kullan
                    const mockData: Story[] = [
                        {
                            id: '1',
                            title: 'Örnek Okuma Metni 1',
                            content: 'Bu bir örnek okuma metnidir. Hızlı okuma pratiği yapmak için kullanılabilir.',
                            story_questions: [
                                {
                                    id: 'q1',
                                    question_text: 'Bu metin ne hakkında?',
                                    options: ['Hızlı okuma', 'Matematik', 'Tarih', 'Bilim'],
                                    correct_option: '0'
                                }
                            ]
                        }
                    ];
                    
                    setReadingTextsList(mockData);
                    setSelectedText(mockData[0]);
                    setAnswers(new Array(mockData[0].story_questions?.length || 0).fill(undefined));
                    console.log('Okunacak aktif metin bulunamadı. Örnek metin gösteriliyor.');
                }
            } catch (err: any) {
                console.error("Error fetching reading texts:", err);
                console.error(`Metinler yüklenemedi: ${err.message || 'Bilinmeyen hata'}`);
                setReadingTextsList([]);
                setSelectedText(null);
            } finally {
                setTextsLoading(false);
            }
        };
        if (user) fetchTexts();
    }, [user]);

    // Mod veya Metin değiştiğinde RSVP'yi sıfırlama Effect'i
    useEffect(() => {
        // Eğer rsvp çalışıyorsa durdur ve state'i temizle
        if (rsvpIntervalId) {
            clearInterval(rsvpIntervalId);
            setRsvpIntervalId(null);
        }
        setIsRsvpRunning(false);
        setRsvpCurrentIndex(0);
        setRsvpWords([]); // Kelimeleri temizle
        setReadingStartTime(null); // Normal okuma zamanlayıcısını da sıfırla
        setShowQuestions(false); // Soruları gizle
        setReadingResults(null); // Sonuçları temizle

    }, [activeMode, selectedText]); // Mod veya metin değiştiğinde tetikle

    // RSVP Interval Cleanup Effect'i
     useEffect(() => {
        // Component unmount olduğunda interval'ı temizle
        return () => {
            if (rsvpIntervalId) {
                clearInterval(rsvpIntervalId);
            }
        };
    }, [rsvpIntervalId]); // Sadece interval ID değiştiğinde cleanup'ı yeniden ayarla


    // --- Fonksiyonlar ---

    // Metinsel Çalışma Handlerları
    // Normal okuma başlatma
    const startReading = () => {
        setReadingStartTime(Date.now());
        setReadingResults(null);
        setShowQuestions(false); // Soruları gizle
        // Cevapları sıfırla
        setAnswers(new Array(selectedText?.story_questions?.length || 0).fill(undefined));
    };
    
    // finishReadingAndShowQuestions -> finishCurrentReadingSession olarak yeniden adlandıralım
    const finishCurrentReadingSession = (wpm: number, timeTaken: number) => {
        // Soruları göster ve WPM/süre ile readingResults'ı ayarla
        setReadingResults({ wpm, timeTaken, comprehension: 0 }); // comprehension sonra hesaplanacak
        setShowQuestions(true);
        setReadingStartTime(null); // Normal zamanlayıcıyı durdur
        
        // RSVP state'lerini sıfırla
        if (rsvpIntervalId) clearInterval(rsvpIntervalId);
        setIsRsvpRunning(false);
        setRsvpIntervalId(null);
        
        // Pacing state'lerini sıfırla
        if (pacingIntervalId) clearInterval(pacingIntervalId);
        setIsPacingRunning(false);
        setPacingIntervalId(null);
    };
    const submitAnswers = () => {
        if (!selectedText) return;
    
        // Eğer readingResults yoksa, önce onu oluştur
        let currentReadingResults = readingResults;
        if (!currentReadingResults) {
            const timeTaken = readingStartTime ? (Date.now() - readingStartTime) / 1000 : 0;
            const wordCount = selectedText.content.trim().split(/\s+/).length;
            const wpm = timeTaken > 0 ? Math.round((wordCount / timeTaken) * 60) : 0;
            
            currentReadingResults = {
                wpm,
                comprehension: 0, // Geçici, aşağıda hesaplanacak
                timeTaken
            };
        }

        const questions = selectedText.story_questions || [];
        
        // Debug için
        console.log('=== SUBMIT ANSWERS DEBUG ===');
        console.log('Answers array:', answers);
        console.log('Total questions:', questions.length);
        console.log('Questions details:', questions.map((q, i) => ({ 
            index: i,
            question: q.question_text, 
            correct_option: q.correct_option,
            user_answer: answers[i],
            options: q.options 
        })));
        
        const correctAnswersCount = answers.filter(
            (answerIndex, questionIndex) => {
                if (answerIndex === undefined || answerIndex === null) {
                    console.log(`Question ${questionIndex}: No answer given`);
                    return false;
                }
                
                const question = questions[questionIndex];
                const correctOption = question.correct_option;
                let correctOptionIndex: number;
                
                // correct_option A,B,C,D formatındaysa sayıya çevir
                if (typeof correctOption === 'string' && /^[A-D]$/i.test(correctOption)) {
                    correctOptionIndex = correctOption.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
                } 
                // correct_option sayısal formatsa direkt kullan
                else if (!isNaN(parseInt(correctOption, 10))) {
                    correctOptionIndex = parseInt(correctOption, 10);
                }
                // correct_option doğru cevabın kendisiyse, options array'inde ara
                else {
                    correctOptionIndex = question.options.findIndex(option => 
                        option.trim().toLowerCase() === correctOption.trim().toLowerCase()
                    );
                }
                
                if (isNaN(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex >= question.options.length) {
                    console.log(`Question ${questionIndex}: Invalid or not found correct_option: "${correctOption}"`);
                    console.log(`Available options:`, question.options);
                    return false;
                }
                
                const isCorrect = Number(answerIndex) === correctOptionIndex;
                console.log(`Question ${questionIndex}: User answer: ${answerIndex}, Correct option: "${correctOption}" (index: ${correctOptionIndex}), Match: ${isCorrect}`);
                
                return isCorrect;
            }
        ).length;
    
        console.log('Correct answers count:', correctAnswersCount);
        console.log('Total questions:', questions.length);
        
        const comprehension = questions.length > 0 ? Math.round((correctAnswersCount / questions.length) * 100) : 100;
    
        const finalResults = {
            ...currentReadingResults,
            comprehension
        };
        
        setReadingResults(finalResults);
        showResultsModal(finalResults);
        setShowQuestions(false);
        
        // Reading durumunu temizle
        setReadingStartTime(null);
    };
    const showResultsModal = (results: ReadingResults) => {
        // Modal'ı kaldırdık, sonuçları state'te tutuyoruz
        setReadingResults(results);
    };


    // *** YENİ: RSVP Fonksiyonları ***
    const startRsvp = () => {
        if (!selectedText || isRsvpRunning) return;

        const words = selectedText.content.trim().split(/\s+/).filter(Boolean); // Boş stringleri filtrele
        if (words.length === 0) return;

        setRsvpWords(words);
        setRsvpCurrentIndex(0);
        setIsRsvpRunning(true);
        setShowQuestions(false); // Başlarken soruları gizle
        setReadingResults(null); // Başlarken sonuçları temizle

        const intervalMs = Math.max(50, 60000 / rsvpSpeedWpm); // Minimum 50ms bekleme

        const interval = setInterval(() => {
            setRsvpCurrentIndex(prevIndex => {
                const nextIndex = prevIndex + 1;
                if (nextIndex >= words.length) {
                    // RSVP Bitti
                    clearInterval(interval);
                    setIsRsvpRunning(false);
                    // RSVP bittiğinde otomatik olarak soruları göster/sonucu işle
                    // Geçen süre yaklaşık: words.length * intervalMs / 1000
                    const approxTimeTaken = (words.length * intervalMs) / 1000;
                    finishCurrentReadingSession(rsvpSpeedWpm, approxTimeTaken);
                    return prevIndex; // Index'i daha fazla artırma
                }
                return nextIndex;
            });
        }, intervalMs);

        setRsvpIntervalId(interval);

    };

    const pauseRsvp = () => {
        if (rsvpIntervalId) {
            clearInterval(rsvpIntervalId);
            setRsvpIntervalId(null);
            setIsRsvpRunning(false); // Duraklatıldı olarak işaretle
        }
    };

    const stopRsvp = () => {
        if (rsvpIntervalId) {
            clearInterval(rsvpIntervalId);
            setRsvpIntervalId(null);
        }
        setIsRsvpRunning(false);
        setRsvpCurrentIndex(0); // Başa dön
        // İsteğe bağlı: Durdurulduğunda da sorulara geçilebilir
        // const approxTimeTaken = (rsvpCurrentIndex * (60000 / rsvpSpeedWpm)) / 1000;
        // finishCurrentReadingSession(rsvpSpeedWpm, approxTimeTaken);
    };
    
    // Pacing Fonksiyonları
    const startPacing = () => {
        // Eğer metin yoksa, pacing zaten çalışıyorsa veya kelime yoksa başlatma
        if (!selectedText || isPacingRunning || pacingWords.length === 0) return;

        setPacingCurrentChunkIndex(0); // Baştan başla
        setIsPacingRunning(true);    // Çalışıyor olarak işaretle
        setShowQuestions(false);     // Soruları gizle
        setReadingResults(null);     // Önceki sonuçları temizle

        // Interval süresini hesapla (ms cinsinden) = (60000 / WPM) * Grup Boyutu
        const intervalMs = Math.max(50, (60000 / pacingSpeedWpm) * pacingChunkSize);
        // Toplam kaç tane kelime grubu olduğunu hesapla
        const totalChunks = Math.ceil(pacingWords.length / pacingChunkSize);

        // Kelime/Chunk yoksa interval'ı başlatma
        if (totalChunks <= 0) { setIsPacingRunning(false); return; }

        // Interval'ı başlat
        const interval = setInterval(() => {
            setPacingCurrentChunkIndex(prevIndex => {
                const nextIndex = prevIndex + 1; // Bir sonraki gruba geç
                // Eğer son gruba ulaşıldıysa
                if (nextIndex >= totalChunks) {
                    clearInterval(interval); // Interval'ı durdur
                    setIsPacingRunning(false); // Çalışmıyor olarak işaretle
                    // Geçen süreyi hesapla ve sonuç/soru ekranına geç
                    const approxTimeTaken = (totalChunks * intervalMs) / 1000;
                    finishCurrentReadingSession(pacingSpeedWpm, approxTimeTaken);
                    return prevIndex; // Index'i daha fazla artırma
                }
                return nextIndex; // Sonraki index'e geç
            });
        }, intervalMs);

        setPacingIntervalId(interval); // Interval ID'sini state'e kaydet

    };

    const pausePacing = () => {
        // Eğer interval çalışıyorsa durdur
        if (pacingIntervalId) {
            clearInterval(pacingIntervalId);
            setPacingIntervalId(null);
            setIsPacingRunning(false); // Duraklatıldı olarak işaretle
        }
    };

    const stopPacing = () => {
        // Eğer interval çalışıyorsa durdur
        if (pacingIntervalId) {
            clearInterval(pacingIntervalId);
            setPacingIntervalId(null);
        }
        setIsPacingRunning(false);      // Çalışmıyor olarak işaretle
        setPacingCurrentChunkIndex(0); // İndeksi başa sar
    };

    // --- Render Koşulları ---
    if (userLoading || textsLoading) { 
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                >
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="mt-4 text-center text-blue-600 font-medium">Hızlı Okuma Modülü Yükleniyor...</div>
                </motion.div>
            </div>
        );
    }
    if (!user) { return null; }
    
    if (readingTextsList.length === 0 || !selectedText) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md mx-auto text-center"
                >
                    <BookOpen className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Okuma Metni Bulunamadı</h3>
                    <p className="text-gray-600 dark:text-gray-400">Gösterilecek okuma metni bulunamadı. Lütfen daha sonra tekrar deneyin.</p>
                </motion.div>
            </div>
        );
    }

    const handleModeChange = (key: string) => {
        setActiveMode(key as 'normal' | 'rsvp' | 'pacing');
    };

    // --- Ana JSX ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Hızlı Okuma Merkezi
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Okuma hızınızı artırın ve anlama becerilerinizi geliştirin
                    </p>
                </motion.div>
                {/* İstatistikler, Hedef, Rozetler (Değişiklik yok) */}
                {/* ... */}

                {/* Ana İçerik */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-white/20 shadow-xl"
                >
                    {/* Mode Selector */}
                    <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                                    {selectedText?.title}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Okuma modunu seçin ve egzersize başlayın
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    const nextIndex = (readingTextsList.findIndex(t => t.id === selectedText?.id) + 1) % readingTextsList.length;
                                    setSelectedText(readingTextsList[nextIndex]);
                                }}
                                disabled={isRsvpRunning || readingStartTime !== null || readingTextsList.length <= 1}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium 
                                         disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                            >
                                <ArrowRight className="w-4 h-4 inline mr-1" />
                                Başka Metin
                            </motion.button>
                        </div>

                        {/* Mode Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'normal', icon: BookOpen, title: 'Normal Okuma', desc: 'Geleneksel okuma deneyimi' },
                                { id: 'rsvp', icon: Eye, title: 'Hızlı Gösterim', desc: 'RSVP tekniği ile hızlı okuma' },
                                { id: 'pacing', icon: Target, title: 'Vurgulu Okuma', desc: 'Kelime grupları ile okuma' }
                            ].map((mode) => (
                                <motion.button
                                    key={mode.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleModeChange(mode.id)}
                                    disabled={isRsvpRunning || readingStartTime !== null}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left 
                                        ${activeMode === mode.id 
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                        }
                                        disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <div className="flex items-center mb-2">
                                        <mode.icon className={`w-5 h-5 mr-2 ${activeMode === mode.id ? 'text-blue-600' : 'text-gray-500'}`} />
                                        <span className={`font-semibold ${activeMode === mode.id ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {mode.title}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{mode.desc}</p>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6">
                        {selectedText && (
                            <>
                                {/* SORU CEVAPLAMA EKRANI */}
                                {showQuestions ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-6"
                                    >
                                        <div className="text-center mb-6">
                                            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-full text-sm font-medium mb-4">
                                                <Target className="w-4 h-4 mr-2" />
                                                Anlama Soruları
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                                                "{selectedText.title}"
                                            </h3>
                                        </div>

                                        {(!selectedText.story_questions || selectedText.story_questions.length === 0) ? (
                                            <div className="text-center py-8">
                                                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-600 dark:text-gray-400">Bu metin için anlama sorusu bulunamadı.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {selectedText.story_questions.map((q, idx) => (
                                                    <motion.div
                                                        key={q.id || idx}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
                                                    >
                                                        <p className="font-semibold text-gray-800 dark:text-white mb-4 text-lg">
                                                            {idx + 1}. {q.question_text}
                                                        </p>
                                                        <div className="space-y-3">
                                                            {q.options.map((option, optIdx) => (
                                                                <motion.label
                                                                    key={optIdx}
                                                                    whileHover={{ scale: 1.02 }}
                                                                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                                                                        ${answers[idx] === optIdx 
                                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                                                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                                        }`}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name={`question-${idx}`}
                                                                        value={optIdx}
                                                                        checked={answers[idx] === optIdx}
                                                                        onChange={() => {
                                                                            const newAnswers = [...answers];
                                                                            newAnswers[idx] = optIdx;
                                                                            setAnswers(newAnswers);
                                                                        }}
                                                                        className="w-4 h-4 text-blue-600 mr-3"
                                                                    />
                                                                    <span className="text-gray-700 dark:text-gray-300">{option}</span>
                                                                </motion.label>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={submitAnswers}
                                            disabled={
                                                !!selectedText.story_questions && selectedText.story_questions.length > 0 &&
                                                (answers.some(ans => ans === undefined || ans === null) || answers.length !== selectedText.story_questions.length)
                                            }
                                            className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold text-lg
                                                     disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                                        >
                                            <ChevronRight className="w-5 h-5 inline mr-2" />
                                            Cevapları Gönder & Sonucu Gör
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <>
                                        {/* NORMAL OKUMA MODU */}
                                        {activeMode === 'normal' && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-6"
                                            >
                                                {!readingStartTime ? (
                                                    <div className="text-center py-12">
                                                        <Clock className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                                                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                                                            Okumaya Hazır Mısınız?
                                                        </h3>
                                                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                                            Başlat butonuna tıkladığınızda süre başlayacak. Metni okuduktan sonra bitir butonuna basın.
                                                        </p>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={startReading}
                                                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300"
                                                        >
                                                            <Play className="w-5 h-5 mr-2" />
                                                            Okumaya Başla
                                                        </motion.button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                                                            <div className="max-h-96 overflow-y-auto">
                                                                <div className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 space-y-4">
                                                                    {selectedText.content.split('\n').map((paragraph, i) => 
                                                                        paragraph.trim() ? (
                                                                            <p key={i} className="mb-4">{paragraph}</p>
                                                                        ) : (
                                                                            <div key={i} className="h-4"></div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => {
                                                                const timeTaken = readingStartTime ? (Date.now() - readingStartTime)/1000 : 0;
                                                                const wordCount = selectedText.content.trim().split(/\s+/).length;
                                                                const wpm = timeTaken > 0 ? Math.round((wordCount / timeTaken) * 60) : 0;
                                                                finishCurrentReadingSession(wpm, timeTaken);
                                                            }}
                                                            className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300"
                                                        >
                                                            <Square className="w-5 h-5 inline mr-2" />
                                                            Okumayı Bitirdim & Soruları Göster
                                                        </motion.button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* RSVP MODU */}
                                        {activeMode === 'rsvp' && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-6"
                                            >
                                                {/* RSVP Hız Ayarı */}
                                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 p-6 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">
                                                        RSVP Hız Ayarı
                                                    </h4>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[60px]">
                                                            {rsvpSpeedWpm} WPM
                                                        </span>
                                                        <input
                                                            type="range"
                                                            min={100}
                                                            max={1000}
                                                            step={50}
                                                            value={rsvpSpeedWpm}
                                                            onChange={(e) => setRsvpSpeedWpm(Number(e.target.value))}
                                                            disabled={isRsvpRunning}
                                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                                                        />
                                                        <input
                                                            type="number"
                                                            min={100}
                                                            max={1000}
                                                            step={50}
                                                            value={rsvpSpeedWpm}
                                                            onChange={(e) => setRsvpSpeedWpm(Number(e.target.value))}
                                                            disabled={isRsvpRunning}
                                                            className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white disabled:opacity-50"
                                                        />
                                                    </div>
                                                </div>

                                                {/* RSVP Gösterim Alanı */}
                                                <div 
                                                    ref={rsvpContainerRef}
                                                    className="h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-gray-300/50 dark:border-gray-600/50 text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 dark:text-white overflow-hidden shadow-inner"
                                                >
                                                    {isRsvpRunning ? (
                                                        <motion.span
                                                            key={rsvpCurrentIndex}
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 1.2 }}
                                                            transition={{ duration: 0.1 }}
                                                        >
                                                            {rsvpWords[rsvpCurrentIndex] || '...'}
                                                        </motion.span>
                                                    ) : rsvpWords.length > 0 ? (
                                                        <span className="text-2xl text-gray-500 dark:text-gray-400">
                                                            {rsvpCurrentIndex > 0 ? 'Duraklatıldı' : 'Başlamaya Hazır'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xl text-gray-500 dark:text-gray-400">
                                                            Başlatmak için butona basın
                                                        </span>
                                                    )}
                                                </div>

                                                {/* RSVP Kontrol Butonları */}
                                                <div className="flex flex-wrap gap-4 justify-center">
                                                    {!isRsvpRunning ? (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={startRsvp}
                                                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                                                        >
                                                            <Play className="w-5 h-5 mr-2" />
                                                            {rsvpWords.length > 0 && rsvpCurrentIndex > 0 ? 'Devam Et' : 'Başlat'}
                                                        </motion.button>
                                                    ) : (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={pauseRsvp}
                                                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                                                        >
                                                            <Pause className="w-5 h-5 mr-2" />
                                                            Duraklat
                                                        </motion.button>
                                                    )}
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={stopRsvp}
                                                        disabled={!isRsvpRunning && rsvpCurrentIndex === 0}
                                                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold 
                                                                 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                                                    >
                                                        <Square className="w-5 h-5 mr-2" />
                                                        Sıfırla / Durdur
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* PACING MODU */}
                                        {activeMode === 'pacing' && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-6"
                                            >
                                                {/* Pacing Ayarları */}
                                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-6 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">
                                                        Vurgu Ayarları
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* Hız Ayarı */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                Vurgu Hızı (WPM)
                                                            </label>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[60px]">
                                                                    {pacingSpeedWpm} WPM
                                                                </span>
                                                                <input
                                                                    type="range"
                                                                    min={100}
                                                                    max={800}
                                                                    step={25}
                                                                    value={pacingSpeedWpm}
                                                                    onChange={(e) => setPacingSpeedWpm(Number(e.target.value))}
                                                                    disabled={isPacingRunning}
                                                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    min={100}
                                                                    max={800}
                                                                    step={25}
                                                                    value={pacingSpeedWpm}
                                                                    onChange={(e) => setPacingSpeedWpm(Number(e.target.value))}
                                                                    disabled={isPacingRunning}
                                                                    className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white disabled:opacity-50"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Grup Boyutu Ayarı */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                Kelime Grup Boyutu
                                                            </label>
                                                            <select
                                                                value={pacingChunkSize}
                                                                onChange={(e) => setPacingChunkSize(Number(e.target.value))}
                                                                disabled={isPacingRunning}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white disabled:opacity-50"
                                                            >
                                                                <option value={1}>1 Kelime</option>
                                                                <option value={2}>2 Kelime</option>
                                                                <option value={3}>3 Kelime</option>
                                                                <option value={4}>4 Kelime</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Pacing Metin Alanı */}
                                                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                                                    <div className="max-h-[450px] overflow-y-auto">
                                                        <div className="text-xl sm:text-2xl leading-relaxed text-gray-800 dark:text-gray-200">
                                                            {pacingWords.map((word, index) => {
                                                                const isHighlighted = isPacingRunning &&
                                                                    index >= pacingCurrentChunkIndex * pacingChunkSize &&
                                                                    index < (pacingCurrentChunkIndex + 1) * pacingChunkSize;
                                                                return (
                                                                    <React.Fragment key={index}>
                                                                        <span 
                                                                            className={`inline-block transition-all duration-200 ${
                                                                                isHighlighted 
                                                                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded-lg shadow-lg transform scale-105' 
                                                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 px-1 rounded'
                                                                            }`}
                                                                        >
                                                                            {word}
                                                                        </span>
                                                                        {' '}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Pacing Kontrol Butonları */}
                                                <div className="flex flex-wrap gap-4 justify-center">
                                                    {!isPacingRunning ? (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={startPacing}
                                                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                                                        >
                                                            <Play className="w-5 h-5 mr-2" />
                                                            {pacingCurrentChunkIndex > 0 ? 'Devam Et' : 'Başlat'}
                                                        </motion.button>
                                                    ) : (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={pausePacing}
                                                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                                                        >
                                                            <Pause className="w-5 h-5 mr-2" />
                                                            Duraklat
                                                        </motion.button>
                                                    )}
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={stopPacing}
                                                        disabled={!isPacingRunning && pacingCurrentChunkIndex === 0}
                                                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold 
                                                                 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                                                    >
                                                        <Square className="w-5 h-5 mr-2" />
                                                        Sıfırla / Durdur
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </>
                                )}

                                {/* Son Okuma Sonuçları */}
                                {readingResults && !showQuestions && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl border border-green-200/50 dark:border-green-700/50"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                                                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                                                Son Okuma Sonuçları
                                            </h4>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setReadingResults(null)}
                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </motion.button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {readingResults.wpm}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">WPM</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {readingResults.comprehension}%
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Anlama</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                    {readingResults.timeTaken.toFixed(1)}s
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Süre</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// Wrapper
const SpeedReadingPage: React.FC = () => <RequireAuth><SpeedReadingPageContent /></RequireAuth>;

export default SpeedReadingPage;